import dotenv from "dotenv";
import { Octokit } from "octokit";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
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