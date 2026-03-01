import express, { Request, Response, NextFunction, json } from 'express';
import { getSubscriptions, getSubscriptionsOfUser, deleteSubscription, updateSubscriptionDetails, createSubscription } from '../../database/queries';
export const subscriptionsRouter = express.Router();

interface getUserParams {
    id: string;
}
subscriptionsRouter.get("/", async (req : Request, res : Response) => {
    const notes = await getSubscriptions()
    res.status(200).json(notes)
})


subscriptionsRouter.get("/:id", async (req : Request<getUserParams>, res : Response) => {
    const user = await getSubscriptionsOfUser(req.params.id)
    res.status(200).json(user)
})

subscriptionsRouter.post("/add", async (req : Request, res : Response) => {
    if (!req.body || !req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("repo") || !req.body.hasOwnProperty("subscriber")) {return res.status(500).json({error: "Missing param/s in request body"})}
    const result = await createSubscription(req.body.repo, req.body.username, req.body.subscriber)
    res.json(result)
})

subscriptionsRouter.delete("/delete", async (req : Request, res : Response) => {
    if (!req.body || !req.body.hasOwnProperty("id") ) {return res.status(500).json({error: "Missing param/s in request body"})}
    const result = await deleteSubscription(req.body.id)
    res.json({"deleted" :result})
})

subscriptionsRouter.put("/update", async (req: Request, res: Response) => {
    if (!req.body || !req.body.hasOwnProperty("id") ) {return res.status(500).json({error: "Missing param/s in request body"})}
    const result = await updateSubscriptionDetails(
        req.body.id, 
        req.body.hasOwnProperty("subscriber") ? req.body.subscriber : null,
        req.body.hasOwnProperty("username") ? req.body.username : null,
        req.body.hasOwnProperty("repo") ? req.body.repo : null,
        req.body.hasOwnProperty("etag") ? req.body.etag : null,
        req.body.hasOwnProperty("latestCommitSha") ? req.body.latestCommitSha : null,
    )
    res.json({"updated":result})
})