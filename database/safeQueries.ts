import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';
import {EventSubscription, EventSubscriptionC, Subscription, SubscriptionC, User, UserC} from "../server/zod-schemas"
import {handle, Result, getValueSyntax, setSyntaxSQL, addSyntaxSql} from "../util"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') })



// Pool of connections that can be reused as app starts to scale
// Such that you don't need to establish a new connection every time you make a query
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
}).promise() // todo handle pool create error

// CRUD FOR USERS ------------------------------------------------------------------------------------------------------------
export const getUsers = async () : Promise<Result<User[]>> => {
    const usersPromise = pool.query(`SELECT * FROM users;`);
    const [err, res] = await handle(usersPromise)
    if (err || !res ) {
        return [err ? err : new Error("DB Error"), null]
    } else {
        const [rows, fields] = res;
        return [null, rows as User[]];
    }
}

export const getUserById = async (id: number) : Promise<Result<User>> => {
    const userPromise = pool.query<RowDataPacket[]>(`
        SELECT * FROM users where id = ?;
        `, [id])
    const [err, res] = await handle(userPromise)
    if (err || !res || res[0].length < 1) {
        return [err ? err : new Error("DB Error"), null]
    } else {
        const [rows, fields] = res;
        return [null, rows[0] as User]
    }
}

export const deleteUserById = async (id: number) : Promise<Result<boolean>> => {
    const delPromise = pool.query<ResultSetHeader>(`DELETE FROM users where id = ?;`,[id]);
    const [err, res] = await handle(delPromise)
    if (err || !res) {
        return [err ? err : new Error("DB Error"), null]
    } else {
        const [resp, fields] = res;
        return resp.affectedRows === 1 ? [null, true] : [null, false]
    }
}

export const updateUser = async (u : User) : Promise<Result<boolean>> => {
    const { id, ...fieldsToUpdate } = u;
    const keys = Object.keys(fieldsToUpdate);
    const values = Object.values(fieldsToUpdate);
    if (keys.length === 0) {
        return [null, true]; 
    }
    const updatePromise = pool.query<ResultSetHeader>(`
        UPDATE users SET ${setSyntaxSQL(keys)} WHERE id = ?
        `, [...values, id])

    const [err, res] = await handle(updatePromise)
    if (err || !res) {
        return [err ? err : new Error("DB Error"), null]
    } else {
        const [resp, fields] = res;
        return resp.affectedRows === 1 ? [null, true] : [null, false]
    }

}

export const createUser = async (u: UserC) : Promise<Result<{success: boolean, insertId: number}>> => {
    const keys = Object.keys(u);
    const values = Object.values(u);
    const createPromise = pool.query<ResultSetHeader>(`
        INSERT INTO users 
        (${addSyntaxSql(keys)})
        VALUES (${getValueSyntax(values)});
        `, values)
    const [err, res] = await handle(createPromise);
    if (err || !res) {
        return [err ? err : new Error("DB Error"), null]
    } else {
        const [resp, fields] = res;
        return resp.affectedRows === 1 ? [null, {success: true, insertId: resp.insertId}] : [null, {success: false, insertId: -1}]
    }
}

// tests
// console.log(await getUserById(1))
// console.log(await getUsers())
// console.log(await updateUser({id: 1, email: "yomama@gmail.com"}))
// console.log(await createUser({username: "yomama", email: "yomama@gmail.com"}))

// CRUD FOR SUBSCRIPTIONS ------------------------------------------------------------------------------------------------------------

export const getSubscriptions = async () : Promise<Result<Subscription[]>> => {
    const subsPromise = pool.query<RowDataPacket[]>(`SELECT * FROM subscriptions;`)
    const [err, subs] = await handle(subsPromise)
    if (err || !subs) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [rows, fields] = subs
    return [null, rows as Subscription[]]
}


export const getSubscriptionBySubscriptionId = async (id: number) : Promise<Result<Subscription>> => {
    const subPromise = pool.query<RowDataPacket[]>(`
        SELECT * FROM subscriptions where id = ?;`, [id])
    const [err, sub] = await handle(subPromise)
    if (err || sub[0].length < 1) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [rows, fields] = sub
    return [null, rows[0] as Subscription]
}

export const getSubscriptionsBySubscriberId = async (id: number) : Promise<Result<Subscription[]>> => {
    const subPromise = pool.query<RowDataPacket[]>(`
        SELECT * FROM subscriptions where subscriber = ?;`, [id])
    const [err, sub] = await handle(subPromise)
    if (err || sub[0].length < 1) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [rows, fields] = sub
    return [null, rows as Subscription[]]
} 

export const createSubscription = async (s: SubscriptionC) : Promise<Result<{success: boolean, insertId: number}>> => {
    const keys = Object.keys(s)
    const values = Object.values(s)
    const createPromise = pool.query<ResultSetHeader>(
        `
        INSERT INTO subscriptions (${addSyntaxSql(keys)})
        VALUES (${getValueSyntax(values)});
        `,
        values
    )
    const [err, resp] = await handle(createPromise)
    if (err || !resp) {
        return [err, null]
    }
    return resp[0].affectedRows === 1 ? [null,{success: true, insertId: resp[0].insertId}] : [null,{success : false, insertId: - 1}]
}

export const updateSubscription = async (s: Subscription) : Promise<Result<boolean>> => {
    const { id, ...fieldsToUpdate } = s;
    const keys = Object.keys(fieldsToUpdate);
    const values = Object.values(fieldsToUpdate);
    if (keys.length === 0) {
        return [null, true]; 
    }
    const updatePromise = pool.query<ResultSetHeader>(
        `
        UPDATE subscriptions     SET ${setSyntaxSQL(keys)} WHERE id = ?
        `,
        [...values, id]
    )
    const [err, resp] = await handle(updatePromise)
    if (err || !resp) {
        return [err, null]
    }
    return resp[0].affectedRows === 1 ? [null, true] : [null, false]
}

export const deleteSubscription = async (id: number) : Promise<Result<boolean>> => {
    const delPromise = pool.query<ResultSetHeader>(`DELETE FROM subscriptions where id = ?`, [id])
    const [err, resp] = await handle(delPromise)
    if (err || resp[0].affectedRows < 1) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [r, f] = resp
    return r.affectedRows === 1 ? [null, true]: [null, false]
}

// tests
//console.log(await getSubscriptions())
//console.log(await getSubscriptionsBySubscriptionId(1))
//console.log(await createSubscription({username: "aadidapurkar", repo: "lockin", subscriber: 1}))
//console.log(await updateSubscription({id: })

// CRUD FOR EVENTS OF SUBSCRIPTIONS ------------------------------------------------------------------------------------------------------------
export const getAllEventsForAllSubscriptions = async () : Promise<Result<EventSubscription[]>> => {
    const subsPromise = pool.query<RowDataPacket[]>(`SELECT * FROM events_subscriptions;`)
    const [err, subs] = await handle(subsPromise)
    if (err || !subs) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [rows, fields] = subs
    return [null, rows as EventSubscription[]]
}

export const getEventById = async (id: number) : Promise<Result<EventSubscription>> => {
    const subPromise = pool.query<RowDataPacket[]>(`
        SELECT * FROM events_subscriptions where id = ?;`, [id])
    const [err, sub] = await handle(subPromise)
    if (err || sub[0].length < 1) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [rows, fields] = sub
    return [null, rows[0] as EventSubscription]
}

export const getEventsForSubscriptionId = async (id: number) : Promise<Result<EventSubscription[]>> => {
    const subPromise = pool.query<RowDataPacket[]>(`
        SELECT * FROM events_subscriptions where subscriptionRef = ?;`, [id])
    const [err, sub] = await handle(subPromise)
    if (err) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [rows, fields] = sub
    return [null, rows as EventSubscription[]]
}   

export const deleteEventById = async (id: number) : Promise<Result<boolean>>=> {
    const delPromise = pool.query<ResultSetHeader>(`DELETE FROM events_subscriptions where id = ?`, [id])
    const [err, resp] = await handle(delPromise)
    if (err || resp[0].affectedRows < 1) {
        return [err ? err : new Error("DB Error"), null]
    }
    const [r, f] = resp
    return r.affectedRows === 1 ? [null, true]: [null, false]
}

export const updateEvent = async (e : EventSubscription) : Promise<Result<boolean>> => {
    const { id, ...fieldsToUpdate } = e;
    const keys = Object.keys(fieldsToUpdate);
    const values = Object.values(fieldsToUpdate);
    if (keys.length === 0) {
        return [null, true]; 
    }
    const updatePromise = pool.query<ResultSetHeader>(
    `
    UPDATE events_subscriptions SET ${setSyntaxSQL(keys)} WHERE id = ?
    `,
    [...values, id]
    )
    const [err, resp] = await handle(updatePromise)
    if (err || !resp) {
        return [err, null]
    }
    return resp[0].affectedRows === 1 ? [null, true] : [null, false]
}

export const createEventForSubscription = async (e: EventSubscriptionC) : Promise<Result<{success: boolean, insertId: number}>> => {
    const keys = Object.keys(e)
    const values = Object.values(e)
    const createPromise = pool.query<ResultSetHeader>(
        `
        INSERT INTO events_subscriptions (${addSyntaxSql(keys)})
        VALUES (${getValueSyntax(values)});
        `,
        values
    )
    const [err, resp] = await handle(createPromise)
    if (err || !resp) {
        return [err, null]
    }
    return resp[0].affectedRows === 1 ? [null,{success: true, insertId: resp[0].insertId}] : [null,{success : false, insertId: - 1}]
}

// console.log(await getAllEventsForAllSubscriptions())
// console.log(await getEventsForSubscriptionId(4))
// console.log(await getEventById(1))
// console.log(await createEventForSubscription({subscriptionRef: 4, eventType: "GollumEvent"}))
// console.log(await updateEventById({id: 3, eventType: "GollumEvent"}))


// CRUD FOR NOTIFICATIONS OF EVENTS ------------------------------------------------------------------------------------------------------------
