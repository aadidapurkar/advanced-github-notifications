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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const cachedFetch = makeFetchHappen.defaults({
  cachePath: "./.gh-cache",
});
import { Result } from "../util";


// octokit auth for 5500 request/hour authenticated rate limit as opposed to 60
const octokit = new Octokit({
  auth: process.env.TOKEN,
  request: {
    fetch: cachedFetch,
  },
});



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