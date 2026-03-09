import express, { Request, Response, NextFunction, json } from 'express';
import {addEventForASubscriptionReqSchema, deleteEventForASubscriptionReqSchema, getAllEventsOfSubscriberReqSchema, updateEventForASubscriptionReqSchema } from "../zod-schemas"

import { createEventForSubscription, deleteEventById, getAllEventsForAllSubscriptions, getEventsForSubscriptionId, updateEvent} from '../../database/safeQueries';
export const eventsSubscriptionRouter = express.Router();


eventsSubscriptionRouter.get("/", async (req : Request, res : Response) => {
    const [err, subs] = await getAllEventsForAllSubscriptions()
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(subs)
})

eventsSubscriptionRouter.get("/:id", async (req : Request, res : Response) => {
    const reqParse = getAllEventsOfSubscriberReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
    return res.status(400).json(reqParse.error)
    }
    const [err, events] = await getEventsForSubscriptionId(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(events)
})

eventsSubscriptionRouter.post("/add", async (req : Request, res : Response) => {
    const reqParse = addEventForASubscriptionReqSchema.safeParse(req.body)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, resp] = await createEventForSubscription(reqParse.data)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(resp)
})

eventsSubscriptionRouter.delete("/delete", async (req : Request, res : Response) => {
    const reqParse = deleteEventForASubscriptionReqSchema.safeParse(req.body)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, succ] = await deleteEventById(reqParse.data.id)
    return err ? res.status(500).json({error: err.message})  : res.status(200).json(succ)
})

eventsSubscriptionRouter.put("/update", async (req: Request, res: Response) => {
    const reqParse = updateEventForASubscriptionReqSchema.safeParse(req.body)
    if(reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user] = await updateEvent(reqParse.data)
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(user)
})