import express, { Request, Response, NextFunction, json } from "express";
import { usersRouter } from "./routes/users";
import { subscriptionsRouter } from "./routes/subscriptions";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { eventsSubscriptionRouter } from "./routes/events-subscriptions";
import { notifRouter } from "./routes/notifications";
import { getSubscriptions, updateSubscription } from "../database/safeQueries";
import { filterGithubEventsArrayForDesiredEventsOfSubscription, getGithubEventsOfEachSubscription, getUnparsedEvents, mapEventToSchema } from "../github-rest-api/atomicPollingFunctions";
import { Subscription } from "./zod-schemas";
import { FlattenedEvent, GithubRepoEvent } from "../types";
import {printNonNull} from "../util"
import { promises as fs } from "fs";
const app = express();
app.use(json());
app.use("/users", usersRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/events-subscriptions", eventsSubscriptionRouter);
app.use("/notifs", notifRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err.stack);
  res.status(500).json({ error: "Something broke" });
});

app.listen(8080, () => console.log("Server running"));

// poller fn
const pollAllSubscriptions = async () => { 
  console.log("Polling has begun...")
  // 1. Get subscriptions and their recent events
  const [err, subsAndRecentEvents] = await getGithubEventsOfEachSubscription();
  if (err || !subsAndRecentEvents) {
    console.error("Error fetching subscriptions:", err);
    return;
  }

  const processedSubscriptions: [Subscription, FlattenedEvent[]][] = [];

  // 2. Iterate through subsAndRecentEvents
  for (const [sub, recentEvents] of subsAndRecentEvents) {
    // 4. Filter out already parsed events using getUnparsedEvents()
    const latestTime = sub.latestEventTime ? new Date(sub.latestEventTime) : new Date("1900-01-01");

    // Update latestEventTime in database to the most recent event we just fetched
    if (recentEvents.length > 0) {
      const newestEventInBatch = new Date(Math.max(...recentEvents.map(e => new Date(e.created_at || "1900-01-01").getTime())));
      if (newestEventInBatch > latestTime) {
        await updateSubscription({ ...sub, latestEventTime: newestEventInBatch });
      }
    }

    const unparsedEvents = getUnparsedEvents(recentEvents, latestTime);
    
    // 5. Filter for events the user actually wants notifications for
    const [filterErr, desiredEvents] = await filterGithubEventsArrayForDesiredEventsOfSubscription(unparsedEvents, sub);
    if (filterErr || !desiredEvents || desiredEvents.length === 0) continue;

    // 6. Hydrate and extract the desired events using mapEventToSchema
    const hydratedEventsPromises = desiredEvents.map(async (event) => {
        const [mapErr, flattened] = await mapEventToSchema(event);
        if (mapErr) {
            console.error("Hydration error:", mapErr);
            return null;
        }
        return flattened;
    });

    const flattenedEvents = (await Promise.all(hydratedEventsPromises)).filter(Boolean) as FlattenedEvent[];
    if (flattenedEvents.length > 0) {
        processedSubscriptions.push([sub, flattenedEvents]);
    }
  }

  // 7. Console log the result using printNonNull
  // processedSubscriptions.forEach(([sub, events]) => {
  //   console.log(`\n--- New events for subscription ${sub.id} (${sub.username}/${sub.repo}) ---`);
  //   events.forEach((e, i) => {
  //     console.log(`Event ${i + 1}:`);
  //     printNonNull(e);
  //   });
  // });
if (processedSubscriptions.length > 0) {
    try {
      // Map the tuples into a more readable JSON format
      const outputData = processedSubscriptions.map(([sub, events]) => ({
        subscriptionId: sub.id,
        repository: `${sub.username}/${sub.repo}`,
        events: events
      }));

      // Write to pollingOutput.json in the current directory
      await fs.writeFile(
        "pollingOutput.json", 
        JSON.stringify(outputData, null, 2)
      );
      
      console.log(`Successfully wrote ${outputData.length} subscriptions to pollingOutput.json`);
    } catch (writeErr) {
      console.error("Error writing to pollingOutput.json:", writeErr);
    }
  } else {
    console.log("No new events to write.");
  }
}

setInterval(pollAllSubscriptions, 20000);

