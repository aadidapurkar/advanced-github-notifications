import express, { Request, Response, NextFunction, json } from 'express';
import {getUsers, createUser, getUser, deleteUser, updateUserDetails, getSubscriptions, updateSubscriptionDetails} from '../database/queries';
import {usersRouter} from "./routes/users"
import { subscriptionsRouter } from './routes/subscriptions';
import { getLatestCommitShaMsg } from '../github-rest-api/githubApi';
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express();
app.use(json());
app.use('/users',usersRouter)
app.use('/subscriptions',subscriptionsRouter)

app.use((err : Error, req : Request, res : Response , next : NextFunction) => {
    console.log(err.stack)
    res.status(500).json({error: "Something broke"})
})

app.listen(8080, () => console.log("Server running"))


// poller - for each subscription - checks latest commit and compares sha in db, if mismatch, console logs the commit msg
// note - first notif will be sent during first poll because sha in db will change from null -> actual, this is probably good to leave in while testing 
// for production, a simple dirty fix could be to just not send the first notification via a db boolean flag like receivedFirstNotif, or when doing the sql query for creating the user, call the get latest commit sha fn
const pollAllSubscriptions = async () => {
    const subscriptions = await getSubscriptions()
    const latestCommitPromises = subscriptions.map(s => getLatestCommitShaMsg(s.username, s.repo))
    const latestCommits = await Promise.all(latestCommitPromises);
    const latestDbShas = subscriptions.map(s => s.latestCommitSha)
    const sideEffects = latestCommits.map(async (c, i)=> {
        if (latestDbShas[i] !== c.sha) {
            console.log(`Detected latest sha mismatch between ${c.sha} and ${latestDbShas[i]}`)
            const response = await updateSubscriptionDetails(subscriptions[i].id.toString(), undefined, undefined, undefined, undefined, c.sha)
            console.log(`NOTIFICATION: ${c.msg}`)
        }
    })
}

setInterval(pollAllSubscriptions, 20000);