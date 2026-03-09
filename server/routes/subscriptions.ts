import express, { Request, Response, NextFunction, json } from 'express';
import {addSubscriptionReqSchema, deleteSubscriptionReqSchema, getParticularSubscriptionReqSchema, updateEventForASubscriptionReqSchema, updateSubscriptionReqSchema } from "../zod-schemas"

import {createSubscription, deleteSubscription, getSubscriptions, getSubscriptionsBySubscriberId, updateSubscription} from "../../database/safeQueries"
export const subscriptionsRouter = express.Router();

subscriptionsRouter.get("/", async (req : Request, res : Response) => {
    const [err, subs] = await getSubscriptions()
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(subs)
})


subscriptionsRouter.get("/:id", async (req : Request, res : Response) => {
    const reqParse = getParticularSubscriptionReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, subs] = await getSubscriptionsBySubscriberId(reqParse.data.id)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(subs)
})

subscriptionsRouter.post("/add", async (req : Request, res : Response) => {
    const reqParse = addSubscriptionReqSchema.safeParse(req.body)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, resp] = await createSubscription(reqParse.data)
    return err ? res.status(500).json({error: err.message}) : res.status(200).json(resp)
})

subscriptionsRouter.delete("/delete", async (req : Request, res : Response) => {
    const reqParse = deleteSubscriptionReqSchema.safeParse(req.body)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, succ] = await deleteSubscription(reqParse.data.id)
    return err ? res.status(500).json({error: err.message})  : res.status(200).json(succ)
})

subscriptionsRouter.put("/update", async (req: Request, res: Response) => {
    const reqParse = updateSubscriptionReqSchema.safeParse(req.body)
    if(reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user] = await updateSubscription(reqParse.data)
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(user)
})