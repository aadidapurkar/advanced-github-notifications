I am building a backend system that polls the GitHub REST API for repository events. I need to map the deeply nested JSON payloads from GitHub's `/events` endpoint into flat TypeScript objects that match the columns in the `events_subscriptions` table of my attached `schema.sql`.

Please update the attached `atomicPollingFunctions.ts` file by completing the following tasks:

1. Create separate synchronous extraction functions for different event categories. Use the official GitHub documentation as the source of truth for payload structures: https://docs.github.com/en/rest/using-the-rest-api/github-event-types?apiVersion=2022-11-28 

Please implement these specific extractors:
- `extractPullRequestData(event)`: Maps PullRequestEvent, PullRequestReviewEvent, and PullRequestReviewCommentEvent to the PR-specific and Shared fields in the schema.
- `extractIssueData(event)`: Maps IssuesEvent and IssueCommentEvent to the Issue-specific and Shared fields in the schema.
- `extractReleaseData(event)`: Maps ReleaseEvent to the Release fields.
- `extractDiscussionData(event)`: Maps DiscussionEvent to the Discussion fields.

2. Refactor the existing `getDetailedCommitInfo` into `hydrateAndExtractPushEvent(event: GithubRepoEvent)`. It should call the `compareCommitsWithBasehead` API and return a flat object matching the Push/Commit columns in `schema.sql`. Please truncate the `gitDiffPatchPrompt` string to 3000 characters to manage memory.

3. Create a master router function `async mapEventToSchema(event: GithubRepoEvent)` that uses a switch statement on `event.type` to call the correct function and return the flattened object.

Strict Requirements:
- Use TypeScript and follow the types in `types.ts`.
- Ensure shared fields (assigneeUsername, hasLabel) are correctly mapped for both Issues and PRs.
- Do not include any keys in the output objects that are not present as columns in `events_subscriptions`.
- Preserve existing Octokit and caching logic in `atomicPollingFunctions.ts`.

