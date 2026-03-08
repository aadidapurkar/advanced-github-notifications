import z from 'zod';
import { RuleProperties } from 'json-rules-engine';
// Suffixes of ReqSchema are used to parse and validate requests on server

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
    id: z.int()
}).strict();

export const updateSubscriptionReqSchema = z.object({
    id: z.number(),
    subscriber: z.number().nullable().optional(),
    username: z.string().nullable().optional(),
    repo: z.string().nullable().optional(),
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
    id: z.number() // subscription id not event id
}).strict();


export const getEventForASubscriptionReqSchema = z.object({
    id: z.number() // event id
}).strict();

export const addEventForASubscriptionReqSchema = z.object({
    subscriptionRef: z.number(), // subscription id not event id
    eventType: z.string(),
    commitMsgSubstring: z.string().nullable().optional(),
    issueCommentContains: z.string().nullable().optional(),
    gitDiffPatchPrompt: z.string().nullable().optional(),
    gitDiffSize: z.number().nullable().optional(),
    particularBranch: z.string().nullable().optional(),
    fileChanged: z.string().nullable().optional(),
    booleanQuery: z.json().nullable().optional() // note - doesnt consider types of json-rules-engine
}).strict();

export const deleteEventForASubscriptionReqSchema = z.object({
    id: z.number()
}).strict();

export const updateEventForASubscriptionReqSchema = z.object({
    id: z.number(), // event id
    subscriptionRef: z.number(), // subscription id not event id
    eventType: z.string(),
    commitMsgSubstring: z.string().nullable().optional(),
    issueCommentContains: z.string().nullable().optional(),
    gitDiffPatchPrompt: z.string().nullable().optional(),
    gitDiffSize: z.number().nullable().optional(),
    particularBranch: z.string().nullable().optional(),
    fileChanged: z.string().nullable().optional(),
    booleanQuery: z.json().nullable().optional() // note - doesnt consider types of json-rules-engine
}).strict();


// Notifications GET for Event
export const getNotificationByEventIdReqSchema = z.object({
    id: z.number() // subscriber id not notif id
}).strict();

export type User = z.infer<typeof updateUserReqSchema>
export type Subscription = z.infer<typeof updateSubscriptionReqSchema>
export type EventSubscription = z.infer<typeof updateEventForASubscriptionReqSchema>
export type Notification = {
    id: number,
    subscriberId: number,
    eventId: number,
    notif: string
}