const bcrypt = require('bcrypt')
const db = require('../config/db')
const { signToken, isSignedIn } = require('../middleware/jwtUtils')
const jwt = require('jsonwebtoken')
const SALT = process.env.SALT ? +process.env.SALT : 12

const signUp = async (req, res) => {
  try {
    req.body.password = bcrypt.hashSync(req.body.password, SALT)
    const user = await db.query(
      `INSERT INTO users (name,cpr,username,password,role,phone,email) VALUES ('${req.body.name}','${req.body.cpr}','${req.body.username}','${req.body.password}','${req.body.role}','${req.body.phone}','${req.body.email}') RETURNING id, name, role, phone, email`
    )
    if (user.rows.length) {
      const newUser = user.rows[0]
      const token = signToken(newUser)
      res.status(200).json({
        user: newUser,
        token,
        message: 'You are registered and Logged-in successfuly'
      })
    } else {
      res.status(200).json({ error: 'Error saving user data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const login = async (req, res) => {
  try {
    if (isSignedIn(req)) {
      return res.status(200).json({ error: 'already logged in !' })
    } else {
      const { username, password } = req.body
      if (!username || !password) {
        return res.status(200).json({ error: 'Missing required fields.' })
      }
      const user = await db.query(
        `SELECT id, name, role, phone, email, password, status FROM users WHERE username='${username}'`
      )
      if (!user.rows.length) {
        return res
          .status(200)
          .json({ error: 'incorrect Username & Password combination.' })
      }
      const foundedUser = user.rows[0]
      const matched = bcrypt.compareSync(password, foundedUser.password)
      if (matched) {
        if (foundedUser.status !== 'active') {
          res.status(200).json({
            error: `User status is (${user.status}), please contact the admin for more information.`
          })
        }
        delete foundedUser.password
        delete foundedUser.status
        const token = signToken(foundedUser)
        res.status(200).json({
          user: foundedUser,
          token,
          message: 'You are Logged-in successfuly'
        })
      } else {
        res
          .status(200)
          .json({ error: 'incorrect Username & Password combination.' })
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { login, signUp }
