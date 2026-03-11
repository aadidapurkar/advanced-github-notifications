// This file will contain the basic / important github api requests
import * as fs from "fs/promises";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import dotenv from "dotenv";
import { Octokit } from "octokit";
import makeFetchHappen from "make-fetch-happen";
import path from "path";
import { fileURLToPath } from "url";
import { CommitPayload, GithubRepoEvent, ZERO_SHA } from "../types";
import {
  getEventsForSubscriptionId,
  getSubscriptionBySubscriptionId,
  updateSubscription,
} from "../database/safeQueries";
import { getSubscriptions } from "../database/safeQueries";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const cachedFetch = makeFetchHappen.defaults({
  cachePath: "./.gh-cache",
});
import { Result } from "../util";
import { Subscription } from "../server/zod-schemas";

// octokit auth for 5500 request/hour authenticated rate limit as opposed to 60
const octokit = new Octokit({
  auth: process.env.TOKEN,
  request: {
    fetch: cachedFetch,
  },
});

// Get github events for a subscription (a subscription can be distinguished by a repository and its owner)
export const getRecentGithubEventsForSubscription = async (
  owner: string,
  repo: string,
): Promise<Result<GithubRepoEvent[]>> => {
  try {
    const response = await octokit.rest.activity.listRepoEvents({
      owner,
      repo,
      per_page: 100, // Maximum allowed per page
    });

    return [null, response.data];
  } catch (error) {
    return [new Error("Error fetching Github Events"), null];
  }
};
// console.log(await getRecentGithubEventsForSubscription("microsoft", "vscode")); // test above fn

// Filter for unparsed events (assumes that the latestEventTime arg will be parsed/queries for the subscription prior to calling this function)
export const getUnparsedEvents = (
  es: GithubRepoEvent[],
  latestEventTime: Date,
): GithubRepoEvent[] => {
  return es.filter((e) => {
    const d = new Date(e.created_at ? e.created_at : "1900-01-01");
    return d > latestEventTime;
  });
};
// const testRes = await getRecentGithubEventsForSubscription("aadidapurkar", "test-notif");
// console.log(await getUnparsedEvents(testRes[1]!, new Date("2026-03-05")).length)

// Returns an array of tuples of size two. fst represents repo owner, snd represents repo name
// Used to prevent duplicate requests to Github REST API
export const getUniqueSubscriptions = async (): Promise<
  Result<[string, string][]>
> => {
  let res: [string, string][] = [];
  const [err, subs] = await getSubscriptions();
  if (err) {
    return [err, null];
  }
  let seenSubscriptions: { [key: string]: null } = {};
  subs.map((s) => {
    const k = `${s.username!}-${s.repo!}`;
    if (!(k in seenSubscriptions)) {
      res.push([s.username!, s.repo!]);
      seenSubscriptions[k] = null;
    }
  });
  return [null, res];
};

// could probably make this function better, it fetches subscriptions from db each call
export const getGithubEventsOfEachSubscription = async (): Promise<
  Result<[Subscription, GithubRepoEvent[]][]>
> => {
  let res: [Subscription, GithubRepoEvent[]][] = [];

  // get subscriptions
  const [err1, subs] = await getSubscriptions();
  if (err1) {
    return [err1, null];
  }

  // get unique subscriptions
  const [err2, uniqueSubs] = await getUniqueSubscriptions();
  if (err2) {
    return [err2, null];
  }

  // hash table, keys rperesnet user-repo in that exact format, values are arrays of github events
  const keyUserRepoValueEvents: { [key: string]: GithubRepoEvent[] } = {};

  // for each unique subscription, get recent github events and add it to the hash table
  for (const [owner, repo] of uniqueSubs) {
    const k = `${owner}-${repo}`;
    const [err, events] = await getRecentGithubEventsForSubscription(
      owner,
      repo,
    );

    if (err) {
      return [err, null];
    }
    keyUserRepoValueEvents[k] = events!;
  }

  // for each subscription, retrieve the events from the hash table (effectively acting as a cache for duplicate subscriptions)
  subs.forEach((s: Subscription) => {
    const k = `${s.username!}-${s.repo!}`;
    res.push([s, keyUserRepoValueEvents[k]!]);
  });

  return [null, res];
};
// const [err, res] = await getGithubEventsOfEachSubscription()
// if (!err) {
//   console.log(JSON.stringify(res, null))
// }

// filter an array of github events to only include the events being listened for by a subscription
// (note that 1 subscription row may have many events_subscription rows)
export const filterGithubEventsArrayForDesiredEventsOfSubscription = async (
  es: GithubRepoEvent[],
  s: Subscription,
): Promise<Result<GithubRepoEvent[]>> => {
  const [err, eventsUserIsListeningFor] = await getEventsForSubscriptionId(
    s.id,
  );
  if (err) {
    return [err, null];
  }
  const eventTypesUserIsListeningFor = eventsUserIsListeningFor.map(
    (e) => e.eventType!,
  );

  const filteredEvents = es.filter((e) =>
    eventTypesUserIsListeningFor.includes(e.type!),
  );
  // console.log(`filterEvents length ${filteredEvents.length} original events ${es.length}`)
  return [null, filteredEvents];
};
// const [err1, testSub] = await getSubscriptionBySubscriptionId(3);
// const [err2, events] = await getRecentGithubEventsForSubscription("microsoft", "vscode");
// const res = await filterGithubEventsArrayForDesiredEventsOfSubscription(events!, testSub!)

// use PushEvent payload to get detailed commit info (todo handle new branch case?)
export const getDetailedCommitInfo = async (
  owner: string,
  repo: string,
  before: string,
  head: string,
): Promise<Result<CommitPayload>> => {
  // branch deletion
  if (head === ZERO_SHA) {
    return [null, { commits: [], files: [], BranchCreationDeletion: "delete" }];
  } else {
    try {
      const resp = await octokit.rest.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${before}...${head}`,
      });

      return [
        null,
        {
          commits: resp.data.commits,
          files: resp.data.files,
          BranchCreationDeletion: before === ZERO_SHA ? "create" : undefined,
        },
      ];
    } catch {
      return [new Error("Error fetching commit comparison"), null];
    }
  }
};

// const [err, res] = await getDetailedCommitInfo(
//   "aadidapurkar",
//   "test-notif",
//   "8435101f78b02788f871335075df0a1a71a8778e",
//   "2060c6e4e1a2eb64e59eb03e8fc5ba0c3868d242",
// );
// console.log(res);

