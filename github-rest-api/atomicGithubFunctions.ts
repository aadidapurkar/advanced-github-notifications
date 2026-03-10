// This file will contain the basic / important github api requests
import * as fs from "fs/promises";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import dotenv from "dotenv";
import { Octokit } from "octokit";
import makeFetchHappen from "make-fetch-happen";
import path from "path";
import { fileURLToPath } from "url";
import { GithubRepoEvent } from "../types";
import { updateSubscription } from "../database/safeQueries";
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


// Get github events
export const getRecentGithubEventsForSubscription = async (
  owner: string,
  repo: string
): Promise<Result<GithubRepoEvent[]>> => {
  try {
    const response = await octokit.rest.activity.listRepoEvents({
      owner,
      repo,
      per_page: 100, // Maximum allowed per page
    });

    return [null, response.data];
  } catch (error) {
    return [new Error("Error fetching Github Events"), null]
  }
};

// console.log(await getRecentGithubEventsForSubscription("microsoft", "vscode")); // test above fn

// Filter for unparsed events
export const getUnparsedEvents = (
  es: GithubRepoEvent[], 
  latestEventTime: Date
) : GithubRepoEvent[] => {
  return es.filter(
    (e) => {
      const d = new Date(e.created_at ? e.created_at : "1900-01-01")
      return d > latestEventTime
    }
  )
}

// const testRes = await getRecentGithubEventsForSubscription("aadidapurkar", "test-notif");
// console.log(await getUnparsedEvents(testRes[1]!, new Date("2026-03-05")).length)


// Get all UNIQUE subscriptions, returns an object where keys are string username-repo, values are an array of two sized tuples where fst represents user id, snd represents subscription id of user
// Used to prevent redundant GithubEvent requests
const getUniqueSubscriptions = async () : Promise<Result<{ [key: string]: [number, number][] }>> => {
  const [err, subs] = await getSubscriptions();
  if (err) {
    return [err, null]
  }
  let seenSubscriptions : { [key: string]: [number, number][] } = {}

  subs.map((s) => {
    const k = `${s.username!}-${s.repo!}`
    if (k in seenSubscriptions) {
      seenSubscriptions[k].push([s.subscriber!, s.id!])
    } else {
      seenSubscriptions[k] = [[s.subscriber!, s.id!]]
    }
  })

  return [null, seenSubscriptions]

}

console.log(JSON.stringify(await getUniqueSubscriptions(), null));