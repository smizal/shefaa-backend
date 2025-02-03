require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
})

const checkPermission = (userRole, roles) => {
  return roles.includes(userRole)
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  checkPermission
}
