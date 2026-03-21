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
  | "ForkEvent"
  | "DiscussionEvent"
  | "MemberEvent";

export interface FlattenedEvent {
  eventType: EventType; // The only strictly required field
  
  // Global
  actionMade?: string;
  actorUsername?: string;
  booleanQuery?: any; // or record/object if you know the exact JSON shape
  targetAuthorUsername?: string;
  targetCommiterUsername?: string;
  authorAssociation?: string;
  eventTime?: Date;

  // Push / Commit
  pusherType?: string;
  minCommitCount?: number;
  maxCommitCount?: number;
  commitMsgSubstring?: string;
  gitDiffPatchPrompt?: string;
  gitDiffSize?: number;
  fileChanged?: string;
  isForcePush?: boolean;

  // Branch / Tag
  sourceBranch?: string;            
  targetBranch?: string;       
  refType?: string;              

  // Pull Request
  pullRequestTitleContains?: string;
  pullRequestBodyContains?: string;
  pullRequestIsDraft?: boolean;
  requestedReviewerUsername?: string;
  reviewCommentBodyContains?: string;
  reviewState?: string;
  isMerged?: boolean;
  pullRequestAdditions?: number;
  pullRequestDeletions?: number;
  requestedTeamName?: string;

  // Issue
  issueTitleContains?: string;
  issueBodyContains?: string;
  issueCommentBodyContains?: string;

  // Shared Issue/PR
  assigneeUsername?: string;
  hasLabel?: string;
  milestoneTitle?: string;
  stateIssuePR?: string;
  
  // Commit Comment
  commitCommentBodyContains?: string;

  // Release
  isPreRelease?: boolean;
  releaseTagSubstring?: string;
  releaseNameContains?: string;
  releaseBodyContains?: string;

  // Gollum/Wiki
  wikiPageTitle?: string;
  wikiPageAction?: string;

  // MemberEvent
  addedMemberUsername?: string;

  // ForkEvent
  forkOwnerUsername?: string;

  // DiscussionEvent
  discussionTitleContains?: string;
  discussionBodyContains?: string;
  discussionCategory?: string;
}
