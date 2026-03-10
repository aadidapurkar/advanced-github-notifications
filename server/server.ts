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
const app = express();
app.use(json());
app.use("/users", usersRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/events-subscriptions", eventsSubscriptionRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err.stack);
  res.status(500).json({ error: "Something broke" });
});

app.listen(8080, () => console.log("Server running"));

// poller - for each subscription - checks latest commit and compares sha in db, if mismatch, console logs the commit msg
// note - first notif will be sent during first poll because sha in db will change from null -> actual, this is probably good to leave in while testing
// for production, a simple dirty fix could be to just not send the first notification via a db boolean flag like receivedFirstNotif, or when doing the sql query for creating the user, call the get latest commit sha fn
// const pollAllSubscriptions = async () => {
//   const subscriptions = await getSubscriptions();
//   // for each subscription
//   await Promise.all(
//     subscriptions.map(async (s) => {
//       // get github events for this subscription
//       const eventsOfSubscription = await getLatestRepoEvents(
//         s.id.toString(),
//         s.username,
//         s.repo,
//         s.latestEventTime!,
//       ); // note that these filter the response of events to only include those events which have not been parsed yet

//       // find out which type of events this subscription wants to be notified for, as well as further desired filters
//       const eventSubscriptions = (await getEventsOfSubscription(s.id))
//       const desiredEvents = eventSubscriptions.map(
//         (e) => e.eventType!,
//       );

//       //console.log(`looking for desiredEvents ${desiredEvents} ${desiredEvents.length} in actual response of events ${eventsOfSubscription.map(e => e.type!)} ${eventsOfSubscription.length} for subscriptions ${s.id}`)
//       //
//       eventsOfSubscription.forEach(async (e, i) => {
//         // checks if the event that occured matches the desired event (note that the current context is a particular github event corresponding to a subscription )
          
//       });
//     }),
//   );
// };

// setInterval(pollAllSubscriptions, 20000);


// a function which takes an event, and returns an array of notifications
// const parseEvent = async (
//   es: EventSubscription,
//   s: Subscription,
//   e: GithubEvent,
// ): Promise<Notification[]> => {
//   let notifications : Notification[]= []
//   if (e.type === "PushEvent") {
//     console.log("Parsing PushEvent");
//     const extraInfo = await getCommitsFromPushEvent(
//       s.username,
//       s.repo,
//       e as any,
//     );
//     console.log(extraInfo);
//   } else if (e.type === "CreateEvent") {

//     console.log("Parsing CreateEvent");

//   } else if (e.type === "DeleteEvent") {

//     console.log("Parsing DeleteEvent");

//   } else if (e.type === "DiscussionEvent") {

//     console.log("Parsing DiscussionEvent");

//   } else if (e.type === "ForkEvent") {

//     console.log("Parsing ForkEvent");
//   } else if (e.type === "GollumEvent") {

//     console.log("Parsing GollumEvent");

//   } else if (e.type === "IssueCommentEvent") {
    
//     console.log("Parsing IssueCommentEvent");

//   } else if (e.type === "MemberEvent") {

//     console.log("Parsing MemberEvent");

//   } else if (e.type === "PublicEvent") {

//     console.log("Parsing PublicEvent");

//   } else if (e.type === "PullRequestEvent") {

//     console.log("Parsing PullRequestEvent");

//   } else if (e.type === "PullRequestReviewEvent") {

//     console.log("Parsing PullRequestReviewEvent");

//   } else if (e.type === "ReleaseEvent") {

//     console.log("Parsing ReleaseEvent");

//   } else if (e.type === "PullRequestReviewCommentEvent") {

//     console.log("Parsing PullRequestReviewEvent");

//   } else if (e.type === "WatchEvent") {

//     console.log("Parsing WatchEvent"

//     )
//   }
//   return notifications;
// };
