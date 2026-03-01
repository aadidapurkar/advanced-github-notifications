import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv'
dotenv.config()


// Pool of connections that can be reused as app starts to scale
// Such that you don't need to establish a new connection every time you make a query
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
}).promise()


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

    const res = await pool.query(
    `
    UPDATE users
    SET ${fieldsSQL}
    WHERE id = ?
    `, [...fieldsLiterals, id]);
    
    return res;
}

export const deleteUser = async (id: string) => {
    const res = await pool.query(
        `
        DELETE FROM users WHERE id = ?
        `, [id]
    )
}
// Note that when you have columns with default setttings e.g PK with AUTO_INCREMENT or DEFAULT columns
// you need to be explicit with the INSERT INTO query and can't use shorthand syntax 
export const createUsers = async(email : string | null = null, username : string, browserNotifPushURL : string | null = null, encryptedPAT : string | null = null) => {
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
    
    const res = await pool.query<ResultSetHeader>(`
        INSERT INTO users (${columnNames})
        VALUES (${valueSql})
        `, fieldsLiterals);
        
    return res;
}


// console.log(await getNote(6))
// console.log(await createNote("test", "test"))