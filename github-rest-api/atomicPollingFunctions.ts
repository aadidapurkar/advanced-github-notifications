// This file will contain the basic / important github api requests
import * as fs from "fs/promises";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import dotenv from "dotenv";
import { Octokit } from "octokit";
import makeFetchHappen from "make-fetch-happen";
import path from "path";
import { fileURLToPath } from "url";
import {
  CommitPayload,
  GithubRepoEvent,
  ZERO_SHA,
  FlattenedEvent,
  EventType,
} from "../types";
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
// basically, if an event has been parsed at an earlier poll, we dont want to parse it again
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

// could probably write this function more elgantly, but it fetches subscriptions and their corresponding github events
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
// important - this is distinct/unrelated to getUnparsedEvents
// what this does, is it narrows the entire retrieved events to only those that a user is interested in for a subscription
// after this, the remaining events may need to be hydrated with additional data for potential detailed queries, and then further parsed, before notifying
export const filterGithubEventsArrayForDesiredEventsOfSubscription = async (
  es: GithubRepoEvent[],
  s: Subscription,
): Promise<Result<GithubRepoEvent[]>> => {
  const [err, eventsUserIsListeningFor] = await getEventsForSubscriptionId(
    s.id,
  ); // note, refactor this because it will redundantly contain the sameevent type multiple times if user has different notifs for the same event
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

// 1. Extraction functions
export const extractPullRequestData = (
  event: GithubRepoEvent,
): FlattenedEvent => {
  const payload = event.payload as any;
  const pr = payload.pull_request;
  const comment = payload.comment;
  const review = payload.review;

  const data: FlattenedEvent = {
    eventType: event.type as EventType,
    actionMade: payload.action,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
  };

  if (pr) {
    data.sourceBranch = pr.head?.ref;
    data.targetBranch = pr.base?.ref;
    data.pullRequestTitleContains = pr.title;
    data.pullRequestBodyContains = pr.body;
    data.pullRequestIsDraft = pr.draft;
    data.isMerged = pr.merged;
    data.targetAuthorUsername = pr.user?.login;
    data.pullRequestAdditions = pr.additions;
    data.pullRequestDeletions = pr.deletions;
    data.authorAssociation = pr.author_association;
    data.stateIssuePR = pr.state;

    if (pr.milestone) {
      data.milestoneTitle = pr.milestone.title;
    }

    if (pr.requested_reviewers) {
      data.requestedReviewerUsername = pr.requested_reviewers
        .map((r: any) => r.login)
        .join(",");
    }

    if (pr.requested_teams) {
      data.requestedTeamName = pr.requested_teams
        .map((t: any) => t.name)
        .join(",");
    }

    if (pr.assignee) {
      data.assigneeUsername = pr.assignee.login;
    } else if (pr.assignees && pr.assignees.length > 0) {
      data.assigneeUsername = pr.assignees.map((a: any) => a.login).join(",");
    }
    if (pr.labels) {
      data.hasLabel = pr.labels.map((l: any) => l.name).join(",");
    }
  }

  if (comment) {
    data.reviewCommentBodyContains = comment.body;
    data.authorAssociation = comment.author_association;
  }

  if (review) {
    data.reviewState = review.state;
    data.authorAssociation = review.author_association;
  }

  return data;
};

// Raw Github Event JSON from Github REST API --> Flattened JSON object matching events_subscriptions in schema.sql
export const extractIssueData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  const issue = payload.issue;
  const comment = payload.comment;

  const data: FlattenedEvent = {
    eventType: event.type as EventType,
    actionMade: payload.action,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
  };

  if (issue) {
    data.issueTitleContains = issue.title;
    data.issueBodyContains = issue.body?.substring(0, 3000) ?? null;
    data.targetAuthorUsername = issue.user?.login;
    data.authorAssociation = issue.author_association;
    data.stateIssuePR = issue.state;

    if (issue.milestone) {
      data.milestoneTitle = issue.milestone.title;
    }

    if (issue.assignee) {
      data.assigneeUsername = issue.assignee.login;
    } else if (issue.assignees && issue.assignees.length > 0) {
      data.assigneeUsername = issue.assignees
        .map((a: any) => a.login)
        .join(",");
    }
    if (issue.labels) {
      data.hasLabel = issue.labels.map((l: any) => l.name).join(",");
    }
  }

  if (comment) {
    data.issueCommentBodyContains = comment.body;
    data.authorAssociation = comment.author_association;
  }

  return data;
};

export const extractReleaseData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  const release = payload.release;

  return {
    eventType: event.type as EventType,
    actionMade: payload.action,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    isPreRelease: release?.prerelease,
    releaseTagSubstring: release?.tag_name,
    releaseNameContains: release?.name,
    releaseBodyContains: release?.body,
  };
};

export const extractDiscussionData = (
  event: GithubRepoEvent,
): FlattenedEvent => {
  const payload = event.payload as any;
  const discussion = payload.discussion;

  return {
    eventType: event.type as EventType,
    actionMade: payload.action,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    discussionTitleContains: discussion?.title,
    discussionBodyContains: discussion?.body,
    discussionCategory: discussion?.category?.name,
  };
};

export const extractCommitCommentData = (
  event: GithubRepoEvent,
): FlattenedEvent => {
  const payload = event.payload as any;
  return {
    eventType: event.type as EventType,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    commitCommentBodyContains: payload.comment?.body,
    targetAuthorUsername: payload.comment?.user?.login,
    authorAssociation: payload.comment?.author_association,
  };
};

export const extractGollumData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  const page = payload.pages?.[0];
  return {
    eventType: event.type as EventType,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    wikiPageTitle: page?.title,
    wikiPageAction: page?.action,
  };
};

export const extractMemberData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  return {
    eventType: event.type as EventType,
    actionMade: payload.action,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    addedMemberUsername: payload.member?.login,
  };
};

export const extractForkData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  return {
    eventType: event.type as EventType,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    forkOwnerUsername: payload.forkee?.owner?.login,
  };
};

export const extractCreateData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  return {
    eventType: event.type as EventType,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    refType: payload.ref_type,
    targetBranch: payload.ref,
  };
};

export const extractDeleteData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  return {
    eventType: event.type as EventType,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    refType: payload.ref_type,
    targetBranch: payload.ref,
  };
};

export const extractDefaultData = (event: GithubRepoEvent): FlattenedEvent => {
  const payload = event.payload as any;
  return {
    eventType: event.type as EventType,
    actionMade: payload.action,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
  };
};

export const hydrateAndExtractPushEvent = async (
  event: GithubRepoEvent,
): Promise<Result<FlattenedEvent[]>> => {
  const payload = event.payload as any;
  const repoFullName = event.repo.name;
  const [owner, repo] = repoFullName.split("/");
  const before = payload.before;
  const head = payload.head;

  const baseData: Partial<FlattenedEvent> = {
    eventType: event.type as EventType,
    actorUsername: event.actor.login,
    eventTime: event.created_at ? new Date(event.created_at) : undefined,
    pusherType: payload.pusher_type || payload.pusher?.type,
    isForcePush: payload.forced,
  };

  if (payload.ref) {
    baseData.targetBranch = payload.ref
      .replace("refs/heads/", "")
      .replace("refs/tags/", "");
    baseData.refType = payload.ref.startsWith("refs/tags/") ? "tag" : "branch";
  }

  if (head === ZERO_SHA) {
    return [null, [{ ...baseData, eventType: "PushEvent" } as FlattenedEvent]];
  }

  try {
    let files: any[] = [];
    let commits: any[] = [];

    if (before === ZERO_SHA) {
      // Just get the single head commit instead of comparing
      const resp = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: head,
      });
      if (resp.data.files) files = resp.data.files;
      commits = [resp.data]; // Wrap the single commit in an array to match comparison structure
    } else {
      // Normal push comparison
      const resp = await octokit.rest.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${before}...${head}`,
      });
      if (resp.data.files) files = resp.data.files;
      if (resp.data.commits) commits = resp.data.commits;
    }

    const flattenedCommits: FlattenedEvent[] = commits.map((commit: any) => {
      const commitData: FlattenedEvent = {
        ...(baseData as FlattenedEvent),
        minCommitCount: 1,
        maxCommitCount: 1,
        commitMsgSubstring: commit.commit?.message || commit.message,
        targetAuthorUsername: commit.author?.login || commit.commit?.author?.name,
        targetCommiterUsername: commit.committer?.login || commit.commit?.committer?.name,
      };

      if (commit.files) {
          commitData.gitDiffSize = commit.files.reduce(
            (acc: number, f: any) => acc + (f.changes || 0),
            0,
          );
          commitData.fileChanged = commit.files.map((f: any) => f.filename).join(",");
          const combinedPatches = commit.files
            .map((f: any) => f.patch)
            .filter(Boolean)
            .join("\n");
          commitData.gitDiffPatchPrompt = combinedPatches.substring(0, 3000);
      }

      return commitData;
    });

    return [null, flattenedCommits];
  } catch (error) {
    console.error("Hydration Error: ", error); // Good for debugging
    return [new Error("Error fetching commit comparison/details"), null];
  }
};

// 3. Master router function
export const mapEventToSchema = async (
  event: GithubRepoEvent,
): Promise<Result<FlattenedEvent[]>> => {
  switch (event.type) {
    case "PushEvent":
      return await hydrateAndExtractPushEvent(event);
    case "PullRequestEvent":
    case "PullRequestReviewEvent":
    case "PullRequestReviewCommentEvent":
      return [null, [extractPullRequestData(event)]];
    case "IssuesEvent":
    case "IssueCommentEvent":
      return [null, [extractIssueData(event)]];
    case "ReleaseEvent":
      return [null, [extractReleaseData(event)]];
    case "DiscussionEvent":
      return [null, [extractDiscussionData(event)]];
    case "CommitCommentEvent":
      return [null, [extractCommitCommentData(event)]];
    case "GollumEvent":
      return [null, [extractGollumData(event)]];
    case "MemberEvent":
      return [null, [extractMemberData(event)]];
    case "ForkEvent":
      return [null, [extractForkData(event)]];
    case "CreateEvent":
      return [null, [extractCreateData(event)]];
    case "DeleteEvent":
      return [null, [extractDeleteData(event)]];
    default:
      return [null, [extractDefaultData(event)]];
  }
};
