import { RestEndpointMethodTypes } from "@octokit/rest";
import { RowDataPacket } from "mysql2";

export type ListRepoEventsResponse =
  RestEndpointMethodTypes["activity"]["listRepoEvents"]["response"];

export type GithubRepoEvent = ListRepoEventsResponse["data"][0];

export type CompareCommitsData =
  RestEndpointMethodTypes["repos"]["compareCommitsWithBasehead"]["response"]["data"];

export interface CommitPayload {
  BranchCreationDeletion?: "delete" | "create";
  commits: CompareCommitsData["commits"];
  files: CompareCommitsData["files"];
}
export const ZERO_SHA = "0000000000000000000000000000000000000000";

export type EventType =
  | "PushEvent"
  | "CommitCommentEvent"
  | "DeleteEvent"
  | "CreateEvent"
  | "PullRequestEvent"
  | "PullRequestReviewEvent"
  | "PullRequestReviewCommentEvent"
  | "IssuesEvent"
  | "IssueCommentEvent"
  | "GollumEvent"
  | "ReleaseEvent"
  | "PublicEvent"
  | "ForkEvent";
