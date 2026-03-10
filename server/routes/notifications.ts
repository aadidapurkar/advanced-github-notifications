import express, { Request, Response, json } from 'express';
import { deleteNotificationById, deleteNotificationsByEventId, deleteNotificationsBySubscriptionId, deleteNotificationsByUserId, getAllNotifications, getNotificationsOfEvent, getNotificationsOfSubscriber, getNotificationsOfSubscription } from '../../database/safeQueries';
import { deleteNotificationByEventIdReqSchema, deleteNotificationByNotifIdReqSchema, deleteNotificationBySubscriptionIdReqSchema, deleteNotificationByUserIdReqSchema, getNotificationByEventIdReqSchema, getNotificationBySubscriberIdReqSchema, getNotificationBySubscriptionIdReqSchema } from '../zod-schemas';
export const notifRouter = express.Router();

notifRouter.get("/", async (req : Request, res : Response) => {
    const [err, subs] = await getAllNotifications()
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(subs)
})

notifRouter.get("/subscriber/:id", async (req : Request, res : Response) => {
    const reqParse = getNotificationBySubscriberIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await getNotificationsOfSubscriber(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})

notifRouter.get("/subscription/:id", async (req : Request, res : Response) => {
    const reqParse = getNotificationBySubscriptionIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await getNotificationsOfSubscription(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})

notifRouter.get("/event/:id", async (req : Request, res : Response) => {
    const reqParse = getNotificationByEventIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await getNotificationsOfEvent(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})

notifRouter.delete("/delete/event/:id", async (req : Request, res : Response) => {
    const reqParse = deleteNotificationByEventIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await deleteNotificationsByEventId(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})


notifRouter.delete("/delete/notif/:id", async (req : Request, res : Response) => {
    const reqParse = deleteNotificationByNotifIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await deleteNotificationById(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})


notifRouter.delete("/delete/subscription/:id", async (req : Request, res : Response) => {
    const reqParse = deleteNotificationBySubscriptionIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await deleteNotificationsBySubscriptionId(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})

notifRouter.delete("/delete/user/:id", async (req : Request, res : Response) => {
    const reqParse = deleteNotificationByUserIdReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, notifs] = await deleteNotificationsByUserId(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(notifs)
})


