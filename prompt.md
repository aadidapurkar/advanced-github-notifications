I have recently updated the `events_subscriptions` table in `database/schema.sql` by adding new useful fields from the GitHub event payloads and removing some redundant ones. 

Please refactor the codebase to align with this new schema. Specifically, update the following files:

1. `types.ts`:
- Update the `FlattenedEvent` type (and any other related database row types) to perfectly mirror the updated `events_subscriptions` schema.
- Add the new fields (e.g., `repositoryName`, `isForcePush`, `minAdditions`, etc.) with their correct TypeScript types.
- Remove any fields that were deleted from the SQL schema (like `isFork`, `branchCreated`, etc., depending on what was removed).

2. `github-rest-api/atomicPollingFunctions.ts`:
- Update the mapping and flattening logic to correctly populate the new `FlattenedEvent` fields using the raw GitHub API payload.
- For example, ensure you map `repository.name` to `repositoryName`, `payload.forced` to `isForcePush`, `payload.pull_request.additions` to `minAdditions`, etc.
- Remove any logic that was populating the now-deleted fields.
- Fix any TypeScript errors resulting from these changes to ensure the event filtering logic still compiles and works correctly.

Please output the complete, updated code for both `types.ts` and `github-rest-api/atomicPollingFunctions.ts`.