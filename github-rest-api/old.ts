import * as fs from "fs/promises";

import dotenv from "dotenv";
import { Octokit } from "octokit";
import makeFetchHappen from "make-fetch-happen";
import path from "path";
import { fileURLToPath } from "url";
import { updateSubscriptionDetails } from "../database/queries";
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

export const getCommits = async (owner: string, repo: string) => {
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  return data;
};
export const getCommitsShaMsg = async (
  owner: string,
  repo: string,
  etag: "string" | null = null,
) => {
  const commits = await getCommits(owner, repo);
  const parsedCommits = commits.map((c) => {
    return {
      sha: c.sha,
      msg: c.commit.message,
    };
  });
  return parsedCommits;
};

export const getLatestCommitShaMsg = async (
  owner: string,
  repo: string,
  etag: "string" | null = null,
) => {
  const parsedCommits = await getCommitsShaMsg(owner, repo);
  const latestCommit = parsedCommits[0];
  return latestCommit;
};


// TESTING ----------------------------------------------------------------------------------------------------------------------------
// const test = await getLatestCommitShaMsg("aadidapurkar", "lockin");
// async function writeToFile() {
//   const outputFilePath: string = "output.txt";
//   const content: string = JSON.stringify(test);
//   try {
//     await fs.writeFile(outputFilePath, content, "utf-8");
//     console.log(`Data written to ${outputFilePath} successfully.`);
//   } catch (error) {
//     console.error("Error writing file:", error);
//   }
// }

// writeToFile();
