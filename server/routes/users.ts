import express, { Request, Response, NextFunction, json } from 'express';
import { getUsers, createUser, getUser, deleteUser, updateUserDetails } from '../../database/queries';
export const usersRouter = express.Router();

interface getUserParams {
    id: string;
}
usersRouter.get("/", async (req : Request, res : Response) => {
    const notes = await getUsers()
    res.status(200).json(notes)
})


usersRouter.get("/:id", async (req : Request<getUserParams>, res : Response) => {
    const user = await getUser(req.params.id)
    res.status(200).json(user)
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