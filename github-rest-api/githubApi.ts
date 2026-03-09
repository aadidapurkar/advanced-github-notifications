import * as fs from "fs/promises";

import dotenv from "dotenv";
import { Octokit } from "octokit";
import makeFetchHappen from "make-fetch-happen";
import path from "path";
import { fileURLToPath } from "url";
import { GithubEvent, PushEvent } from "../types";
import { updateSubscription } from "../database/safeQueries";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const cachedFetch = makeFetchHappen.defaults({
  cachePath: "./.gh-cache",
});



const octokit = new Octokit({
  auth: process.env.TOKEN,
  request: {
    fetch: cachedFetch,
  },
});

/// new approach -- get latest events -- filter those since last event parsed timestamp
// go through each events
export const getLatestRepoEvents = async (
  subId: string,
  owner: string,
  repo: string,
  latestRecordedEventTime: Date,
) => {
  let latestFoundTime = latestRecordedEventTime; // Consistently update the latest event time to update the corresponding column in DB

  const res = await octokit.request(`GET /repos/${owner}/${repo}/events`, {
    owner: owner,
    repo: repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const events: GithubEvent[] = res.data;

  // Filter events whose timestamp is later than the last parsed event timestamp
  const unparsedEvents = events.filter((e) => {
    const eTime = new Date(e.created_at!);
    latestFoundTime = eTime > latestFoundTime ? eTime : latestFoundTime;
    return eTime > latestRecordedEventTime;
  });

  // update row of table subscription column last parsed event time
  if (latestFoundTime > latestRecordedEventTime) {
    updateSubscription({id: parseInt(subId,10), latestEventTime: latestFoundTime})
  }

  return unparsedEvents;
};

export const getCommitsFromPushEvent = async (
  owner: string,
  repo: string,
  e: PushEvent,
) => {
  const b = e.payload.before;
  const h = e.payload.head;
  const ZERO_SHA = "0000000000000000000000000000000000000000";
  if (h === ZERO_SHA) {
    console.log("Branch was deleted. No new commits to compare.");
    return { commits: [] }; // Return an empty array to prevent breaking downstream map() functions
  }
if (b === ZERO_SHA) {
    console.log("New branch created! Fetching the head commit metadata.");
    const res = await octokit.rest.repos.getCommit({
      owner: owner,
      repo: repo,
      ref: h,
    });
    
    return { 
      commits: [res.data],
      files: res.data.files 
    };
  }

  const res = await octokit.rest.repos.compareCommitsWithBasehead({
    owner: owner,
    repo: repo,
    basehead: `${b}...${h}`,
  });

  return { commits: res.data.commits, files: res.data.files };
};
