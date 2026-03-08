import express, { Request, Response, NextFunction, json } from 'express';
import { createUser, getUser, deleteUser, updateUserDetails } from '../../database/queries';
import {getParticularUserReqSchema} from "../zod-schemas"
import { getUsers, getUserById } from '../../database/safeQueries';
export const usersRouter = express.Router();

interface getUserParams {
    id: string;
}
usersRouter.get("/", async (req : Request, res : Response) => {
    const [err, users] = await getUsers()
    return err ? res.status(400).json(err) :  res.status(200).json(users)
})


usersRouter.get("/:id", async (req : Request, res : Response) => {
    const reqParse = getParticularUserReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user ] = await getUserById(reqParse.data.id)
    return err ? res.status(400).json(err) :  res.status(200).json(user)
   
})

usersRouter.post("/add", async (req : Request, res : Response) => {
    if (!req.body || !req.body.hasOwnProperty("username")) {return res.status(500).json({error: "Missing param/s in request body"})}
    const note = await createUser(req.body.username)
    res.json(note)
})

usersRouter.delete("/delete", async (req : Request, res : Response) => {
    if (!req.body || !req.body.hasOwnProperty("id") ) {return res.status(500).json({error: "Missing param/s in request body"})}
    const result = await deleteUser(req.body.id)
    res.json({"deleted" :result})
})

usersRouter.put("/update", async (req: Request, res: Response) => {
    if (!req.body || !req.body.hasOwnProperty("id") ) {return res.status(500).json({error: "Missing param/s in request body"})}
    const result = await updateUserDetails(
        req.body.id, 
        req.body.hasOwnProperty("email") ? req.body.email : null,
        req.body.hasOwnProperty("username") ? req.body.username : null,
        req.body.hasOwnProperty("browserPushNotifURL") ? req.body.browserPushNotifURL : null,
        req.body.hasOwnProperty("encryptedPAT") ? req.body.encryptedPAT : null,
    )
    res.json({"updated":result})
})