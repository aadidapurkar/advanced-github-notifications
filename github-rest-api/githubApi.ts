import dotenv from "dotenv";
import { Octokit } from "octokit";
dotenv.config();
const octokit = new Octokit({
  auth: process.env.TOKEN,
});

const getCommits = async (owner: string, repo: string, etag : "string" | null = null) => {
  const response = await octokit.rest.repos.listCommits({
    owner: owner,
    repo:  repo,
    // sha: "main",
  });
  return response
};


const test = await getCommits("aadidapurkar","lockin")
console.log(test)