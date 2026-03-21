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
import { getEventsForSubscriptionId, getSubscriptions, updateSubscription } from "../database/safeQueries";
import { filterGithubEventsArrayForDesiredEventsOfSubscription, getGithubEventsOfEachSubscription, getUnparsedEvents, mapEventToSchema } from "../github-rest-api/atomicPollingFunctions";
import { Subscription, EventSubscription } from "./zod-schemas";
import { FlattenedEvent, GithubRepoEvent, MatchedEventTuple } from "../types";
import { printNonNull } from "../util";
import { promises as fs } from "fs";
import { Engine } from "json-rules-engine";

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

/**
 * Evaluates a set of flattened events against subscription rules using json-rules-engine.
 */
const evaluateRules = async (
  flattenedEvents: FlattenedEvent[],
  subscriptionRows: EventSubscription[]
): Promise<MatchedEventTuple[]> => {
  const matches: MatchedEventTuple[] = [];

  // 1. Group events by type
  const eventsByType: Record<string, FlattenedEvent[]> = {};
  for (const event of flattenedEvents) {
    if (!eventsByType[event.eventType]) {
      eventsByType[event.eventType] = [];
    }
    eventsByType[event.eventType].push(event);
  }

  // 2. Group subscription rows by type
  const rowsByType: Record<string, EventSubscription[]> = {};
  for (const row of subscriptionRows) {
    if (!rowsByType[row.eventType]) {
      rowsByType[row.eventType] = [];
    }
    rowsByType[row.eventType].push(row);
  }

  // 3. N x M comparison for each event type
  for (const eventType in eventsByType) {
    const events = eventsByType[eventType];
    const rows = rowsByType[eventType] || [];

    for (const event of events) {
      for (const row of rows) {
        // If there's no booleanQuery, we assume it's a match (as it passed the first layer of filtering)
        if (!row.booleanQuery || Object.keys(row.booleanQuery).length === 0) {
          matches.push({ event, subscription: row });
          continue;
        }

        const engine = new Engine();
        
        // The rule from DB might be a single rule or an array/object compatible with json-rules-engine
        try {
          engine.addRule(row.booleanQuery);

          const facts = {
            githubEvent: event,
            subscriptionDB: row,
          };

          const { events: triggeredEvents } = await engine.run(facts);
          if (triggeredEvents.length > 0) {
            matches.push({ event, subscription: row });
          }
        } catch (ruleErr) {
          console.error(`Error evaluating rule for event ${eventType}:`, ruleErr);
        }
      }
    }
  }

  return matches;
};

// poller fn
const pollAllSubscriptions = async () => {
  console.log("Polling has begun...");
  // 1. Get subscriptions and their recent events
  const [err, subsAndRecentEvents] = await getGithubEventsOfEachSubscription();
  if (err || !subsAndRecentEvents) {
    console.error("Error fetching subscriptions:", err);
    return;
  }

  const allMatchedEvents: { subscriptionId: number; repository: string; matches: MatchedEventTuple[] }[] = [];

  // 2. Iterate through subsAndRecentEvents
  for (const [sub, recentEvents] of subsAndRecentEvents) {
    const latestTime = sub.latestEventTime ? new Date(sub.latestEventTime) : new Date("1900-01-01");

    // Update latestEventTime in database to the most recent event we just fetched
    if (recentEvents.length > 0) {
      const newestEventInBatch = new Date(
        Math.max(...recentEvents.map((e) => new Date(e.created_at || "1900-01-01").getTime()))
      );
      if (newestEventInBatch > latestTime) {
        await updateSubscription({ ...sub, latestEventTime: newestEventInBatch });
      }
    }

    const unparsedEvents = getUnparsedEvents(recentEvents, latestTime);

    // 5. Filter for events the user actually wants notifications for (First layer filtering by eventType)
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
    if (flattenedEvents.length === 0) continue;

    // 7. Dynamic Filtering via json-rules-engine
    const [dbErr, subscriptionRows] = await getEventsForSubscriptionId(sub.id);
    if (dbErr || !subscriptionRows) {
      console.error(`Error fetching event rows for subscription ${sub.id}:`, dbErr);
      continue;
    }

    const matchedTuples = await evaluateRules(flattenedEvents, subscriptionRows);
    
    if (matchedTuples.length > 0) {
      allMatchedEvents.push({
        subscriptionId: sub.id,
        repository: `${sub.username}/${sub.repo}`,
        matches: matchedTuples,
      });
    }
  }

  if (allMatchedEvents.length > 0) {
    try {
      // Write to pollingOutput.json in the current directory
      await fs.writeFile("pollingOutput.json", JSON.stringify(allMatchedEvents, null, 2));

      console.log(`Successfully wrote ${allMatchedEvents.length} subscriptions with matches to pollingOutput.json`);
    } catch (writeErr) {
      console.error("Error writing to pollingOutput.json:", writeErr);
    }
  } else {
    console.log("No new matching events to write.");
  }
};

setInterval(pollAllSubscriptions, 20000);
