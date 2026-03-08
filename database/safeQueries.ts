import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';
import {User, UserC} from "../server/zod-schemas"
import {handle, Result, setSyntaxSQL as getSQLFieldSyntax, getValueSyntax, setSyntaxSQL, addSyntaxSql} from "../util"
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
        return [new Error("DB Error"), null]
    } else {
        const [rows, fields] = res;
        return [null, rows as User[]];
    }
}

export const getUserById = async (id: number) : Promise<Result<User>> => {
    const userPromise = pool.query<RowDataPacket[]>(`
        SELECT * FROM users where id = ?
        `, [id])
    const [err, res] = await handle(userPromise)
    if (err || !res || res[0].length < 1) {
        return [new Error("DB Error"), null]
    } else {
        const [rows, fields] = res;
        return [null, rows[0] as User]
    }
}

export const deleteUserById = async (id: number) : Promise<Result<boolean>> => {
    const delPromise = pool.query<ResultSetHeader>(`DELETE FROM users where id = ?`,[id]);
    const [err, res] = await handle(delPromise)
    if (err || !res) {
        return [new Error("DB Error"), null]
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
        UPDATE users SET ${getSQLFieldSyntax(keys)} WHERE id = ?
        `, [...values, id])

    const [err, res] = await handle(updatePromise)
    if (err || !res) {
        return [new Error("DB Error"), null]
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
        VALUES (${getValueSyntax(values)})
        `, values)
    const [err, res] = await handle(createPromise);
    if (err || !res) {
        console.error("Actual DB Error details:", err);
        return [new Error("DB Error"), null]
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


// CRUD FOR EVENTS OF SUBSCRIPTIONS ------------------------------------------------------------------------------------------------------------



// CRUD FOR NOTIFICATIONS OF EVENTS ------------------------------------------------------------------------------------------------------------
