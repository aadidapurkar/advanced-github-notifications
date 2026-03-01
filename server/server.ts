import express, { Request, Response, NextFunction, json } from 'express';
import {getUsers, createUser, getUser, deleteUser, updateUserDetails} from '../database/queries';
import {usersRouter} from "./routes/users"
import { subscriptionsRouter } from './routes/subscriptions';
const app = express();
app.use(json());
app.use('/users',usersRouter)
app.use('/subscriptions',subscriptionsRouter)

app.use((err : Error, req : Request, res : Response , next : NextFunction) => {
    console.log(err.stack)
    res.status(500).json({error: "Something broke"})
})

app.listen(8080, () => console.log("Server running"))
