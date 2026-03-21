import z from 'zod';

// Subscriptions CRUD Req Body for Server
export const getParticularSubscriptionReqSchema = z.object({
    id: z.coerce.number().int().positive(), // user id not subscription id
}).strict();


export const addSubscriptionReqSchema = z.object({
    subscriber: z.number(),
    username: z.string(),
    repo: z.string(),
}).strict();


export const deleteSubscriptionReqSchema = z.object({
    id: z.number().int()
}).strict();

export const updateSubscriptionReqSchema = z.object({
    id: z.number(),
    subscriber: z.number().nullable().optional(),
    username: z.string().nullable().optional(),
    repo: z.string().nullable().optional(),
}).strict();

export const updateSubscriptionSchema = z.object({
    id: z.number(),
    subscriber: z.number().nullable().optional(),
    username: z.string().nullable().optional(),
    repo: z.string().nullable().optional(),
    latestCommitSha: z.string().nullable().optional(),
    latestEventTime: z.coerce.date().nullable().optional(),
}).strict();



// Users Crud Req Body for Server
export const getParticularUserReqSchema = z.object({
    id: z.coerce.number().int().positive()
}).strict();    


export const addUserReqSchema = z.object({
    username: z.string(),
    email: z.string().nullable().optional(),
    browserNotifPushURL : z.string().nullable().optional()
}).strict();


export const deleteUserReqSchema = z.object({
    id: z.number()
}).strict();


export const updateUserReqSchema = z.object({
    id: z.number(),
    email: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    browserPushNotifURL: z.string().nullable().optional(),
}).strict();


/// Events-Subscriptions CRUD Req Body for Server 

export const getAllEventsOfSubscriberReqSchema = z.object({
    id: z.coerce.number().int().positive() // subscription id not event id
}).strict();


export const getEventForASubscriptionReqSchema = z.object({
    id: z.number() // event id
}).strict();

export const addEventForASubscriptionReqSchema = z.object({
    subscriptionRef: z.number(),
    eventType: z.string(),

    // Global Filters
    actionMade: z.string().nullable().optional(),
    actorUsername: z.string().nullable().optional(),
    booleanQuery: z.any().nullable().optional(),
    targetAuthorUsername: z.string().nullable().optional(),
    targetCommiterUsername: z.string().nullable().optional(),
    authorAssociation: z.string().nullable().optional(),
    eventTime: z.coerce.date().nullable().optional(),

    // Push / Commit Filters
    pusherType: z.string().nullable().optional(),
    minCommitCount: z.number().nullable().optional(),
    maxCommitCount: z.number().nullable().optional(),
    commitMsgSubstring: z.string().nullable().optional(),
    gitDiffPatchPrompt: z.string().nullable().optional(),
    gitDiffSize: z.number().nullable().optional(),
    fileChanged: z.string().nullable().optional(),
    isForcePush: z.boolean().nullable().optional(),

    // Branch / Tag Filters
    sourceBranch: z.string().nullable().optional(),            
    targetBranch: z.string().nullable().optional(),       
    refType: z.string().nullable().optional(),

    // Pull Request Filters
    pullRequestTitleContains: z.string().nullable().optional(),
    pullRequestBodyContains: z.string().nullable().optional(),
    pullRequestIsDraft: z.boolean().nullable().optional(),
    requestedReviewerUsername: z.string().nullable().optional(),
    reviewCommentBodyContains: z.string().nullable().optional(),
    reviewState: z.string().nullable().optional(),
    isMerged: z.boolean().nullable().optional(),
    pullRequestAdditions: z.number().nullable().optional(),
    pullRequestDeletions: z.number().nullable().optional(),
    requestedTeamName: z.string().nullable().optional(),

    // Issue Filters
    issueTitleContains: z.string().nullable().optional(),
    issueBodyContains: z.string().nullable().optional(),
    issueCommentBodyContains: z.string().nullable().optional(),

    // Shared Issue & PR Filters
    assigneeUsername: z.string().nullable().optional(),
    hasLabel: z.string().nullable().optional(),
    milestoneTitle: z.string().nullable().optional(),
    stateIssuePR: z.string().nullable().optional(),

    // Commit Comment Filters
    commitCommentBodyContains: z.string().nullable().optional(),
    
    // Release
    isPreRelease: z.boolean().nullable().optional(),
    releaseTagSubstring: z.string().nullable().optional(),
    releaseNameContains: z.string().nullable().optional(),
    releaseBodyContains: z.string().nullable().optional(),

    // Gollum/Wiki
    wikiPageTitle: z.string().nullable().optional(),
    wikiPageAction: z.string().nullable().optional(),

    // MemberEvent
    addedMemberUsername: z.string().nullable().optional(),

    // ForkEvent
    forkOwnerUsername: z.string().nullable().optional(),

    // DiscussionEvent
    discussionTitleContains: z.string().nullable().optional(),
    discussionBodyContains: z.string().nullable().optional(),
    discussionCategory: z.string().nullable().optional(),
}).strict();

export const deleteEventForASubscriptionReqSchema = z.object({
    id: z.number()
}).strict();

export const updateEventForASubscriptionReqSchema = addEventForASubscriptionReqSchema.extend({
    id: z.number()
}).strict();


// Notifications CRUD
export const getNotificationByEventIdReqSchema = z.object({
    id: z.number() 
}).strict();

export const getNotificationBySubscriberIdReqSchema = z.object({
    id: z.number() 
}).strict();

export const getNotificationBySubscriptionIdReqSchema = z.object({
    id: z.number() 
}).strict();

export const deleteNotificationByEventIdReqSchema = z.object({
    id: z.number() 
}).strict();

export const deleteNotificationByNotifIdReqSchema = z.object({
    id: z.number() 
}).strict();

export const deleteNotificationBySubscriptionIdReqSchema = z.object({
    id: z.number() 
}).strict();

export const deleteNotificationByUserIdReqSchema = z.object({
    id: z.number() 
}).strict();

export type User = z.infer<typeof updateUserReqSchema>
export type UserC = z.infer<typeof addUserReqSchema>

export type Subscription = z.infer<typeof updateSubscriptionSchema>
export type SubscriptionC = z.infer<typeof addSubscriptionReqSchema>

export type EventSubscription = z.infer<typeof updateEventForASubscriptionReqSchema>
export type EventSubscriptionC = z.infer<typeof addEventForASubscriptionReqSchema>

export type NotificationOfEvent = {
    id: number,
    subscriberId: number,
    eventId: number,
    notif: string
}

export type NotificationOfEventC = {
    subscriberId: number,
    eventId: number,
    notif: string
}
