require('dotenv').config()

module.exports = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialect: process.env.DB_TYPE,
    port: Number(process.env.DB_PORT),
    pool:{
        min:0,
        max:5,
        acquire:30000,
        idle:10000
    }

}