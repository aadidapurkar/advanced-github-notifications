import express, { Request, Response, NextFunction, json } from 'express';
import {addUserReqSchema, deleteUserReqSchema, getParticularUserReqSchema, updateUserReqSchema} from "../zod-schemas"
import { createUser, getUsers, getUserById, deleteUserById, updateUser } from '../../database/safeQueries';
export const usersRouter = express.Router();

interface getUserParams {
    id: string;
}
usersRouter.get("/", async (req : Request, res : Response) => {
    const [err, users] = await getUsers()
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(users)
})


usersRouter.get("/:id", async (req : Request, res : Response) => {
    const reqParse = getParticularUserReqSchema.safeParse(req.params)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user ] = await getUserById(reqParse.data.id)
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(user)
   
})

usersRouter.post("/add", async (req : Request, res : Response) => {
    const reqParse = addUserReqSchema.safeParse(req.body)
    if (reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user] = await  createUser(reqParse.data)
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(user)
})

usersRouter.delete("/delete", async (req : Request, res : Response) => {
    const reqParse = deleteUserReqSchema.safeParse(req.body)
    if(reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user] = await deleteUserById(reqParse.data.id)
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(user)
})

usersRouter.put("/update", async (req: Request, res: Response) => {
    const reqParse = updateUserReqSchema.safeParse(req.body)
    if(reqParse.success === false) {
        return res.status(400).json(reqParse.error)
    }
    const [err, user] = await updateUser(reqParse.data)
    return err ? res.status(500).json({ error: err.message }) :  res.status(200).json(user)
})