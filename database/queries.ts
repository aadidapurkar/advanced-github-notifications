import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') })

interface Subscription extends RowDataPacket {
  id: number;
  subscriber: number;
  username: string;
  repo: string;
  etag: string | null;
  latestCommitSha: string | null;
}

// Pool of connections that can be reused as app starts to scale
// Such that you don't need to establish a new connection every time you make a query
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
}).promise()


// CRUD FOR USERS ------------------------------------------------------------------------------------------------------------
export const getUsers = async () => {
    const [rows, metadata] = await pool.query("SELECT * FROM users;")
    return rows
}

export const getUser = async (id : string) => {
    const [rows, metadata] = await pool.query<RowDataPacket[]>(
        `
        SELECT * FROM users WHERE id = ?
        `, [id]
    )
    return rows[0]
}

export const updateUserDetails = async (id: string, email : string | null = null, username : string | null = null, browserNotifPushURL : string | null = null, encryptedPAT : string | null = null) => {
    const fieldsLiterals = [email, username, browserNotifPushURL, encryptedPAT].filter(f => f !== null);
    if (fieldsLiterals.length === 0) {
        return;
    }
    const fieldsSQL = [
        ["email", email],
        ["username", username],
        ["browserNotifPushURL", browserNotifPushURL],
        ["encryptedPAT", encryptedPAT]
    ]
    .filter(f => f[1] !== null)
    .map(f => `${f[0]} = ?`)
    .join(', ');

    const [res] = await pool.query<ResultSetHeader>(
    `
    UPDATE users
    SET ${fieldsSQL}
    WHERE id = ?
    `, [...fieldsLiterals, id]);
    
    return res.affectedRows > 0;
}

export const deleteUser = async (id: string) => {
    const [res] = await pool.query<ResultSetHeader>(
        `
        DELETE FROM users WHERE id = ?
        `, [id]
    )
    return res.affectedRows > 0;
}
// Note that when you have columns with default setttings e.g PK with AUTO_INCREMENT or DEFAULT columns
// you need to be explicit with the INSERT INTO query and can't use shorthand syntax 
export const createUser = async(username : string, email : string | null = null, browserNotifPushURL : string | null = null, encryptedPAT : string | null = null) => {
    const fieldsLiterals = [email, username, browserNotifPushURL, encryptedPAT].filter(f => f !== null);
    
    const columnNames = [
        ["email", email],
        ["username", username],
        ["browserNotifPushURL", browserNotifPushURL],
        ["encryptedPAT", encryptedPAT]
    ]
    .filter(f => f[1] !== null)
    .map(f => f[0])
    .join(', ');

    const valueSql = fieldsLiterals.map(() => '?').join(', ');
    
    const [res] = await pool.query<ResultSetHeader>(`
        INSERT INTO users (${columnNames})
        VALUES (${valueSql})
        `, fieldsLiterals);
        
    return { insertId: res.insertId };;
}
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

// CRUD FOR SUBSCRIPTIONS ---------------------------------------------------------------------------------------------------------------------------------------------
export const getSubscriptions = async () => {
    const [rows, metadata] = await pool.query<Subscription[]>("SELECT * FROM subscriptions;")
    return rows
}

export const getSubscriptionsOfUser = async (subscriber : string) => {
    const [rows, metadata] = await pool.query<RowDataPacket[]>(
        `
        SELECT * FROM subscriptions WHERE subscriber = ?
        `, [subscriber]
    )
    return rows
}

export const deleteSubscription = async (id: string) => {
    const [res] = await pool.query<ResultSetHeader>(
        `
        DELETE FROM subscriptions WHERE id = ?
        `, [id]
    )
    return res.affectedRows > 0;
}

export const createSubscription = async (repo : string, username: string, subscriber : string) => {
    const [res] = await pool.query<ResultSetHeader>(`
        INSERT INTO subscriptions (subscriber, username, repo)
        VALUES (?, ?, ?)
        `, [subscriber, username, repo]);
        
     return { insertId: res.insertId };;
}

export const updateSubscriptionDetails = async (id: string, subscriber : string | null = null, username : string | null = null, repo : string | null = null, etag : string | null = null, latestCommitSha : string | null = null) => {
    const fieldsLiterals = [subscriber, username, repo, etag, latestCommitSha].filter(f => f !== null);
    if (fieldsLiterals.length === 0) {
        return;
    }
    const fieldsSQL = [
        ["subscriber", subscriber],
        ["username", username],
        ["repo", repo],
        ["etag", etag],
        ["latestCommitSha", latestCommitSha]
    ]
    .filter(f => f[1] !== null)
    .map(f => `${f[0]} = ?`)
    .join(', ');

    const [res] = await pool.query<ResultSetHeader>(
    `
    UPDATE subscriptions
    SET ${fieldsSQL}
    WHERE id = ?
    `, [...fieldsLiterals, id]);
    
    return res.affectedRows > 0;
}

// testing
