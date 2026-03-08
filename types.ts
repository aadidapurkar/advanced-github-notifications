import { RowDataPacket } from "mysql2";

export type JsonRulesEngineRule = {
  conditions: {
    
  }
}


export interface GithubEvent {
  id: string;
  type: string;
  created_at: string | null;
}

export interface PushEvent extends GithubEvent {
  payload: { head: string; before: string };
}

export type Notification = string;

export interface Subscription extends RowDataPacket {
  id: number;
  subscriber: number;
  username: string;
  repo: string;
  etag: string | null;
  latestCommitSha: string | null;
  latestEventTime: Date | null;


}

export interface EventSubscription extends RowDataPacket {
  id: number;
  subscriptionRef: number;
  eventType: string;
  commitMsgSubstring: string | null;
  issueCommentContains: string | null;
  gitDiffSize: number | null;
  fileChanged: string | null;
  particularBranch: string | null;
  gitDiffPatchPrompt: string | null;
}