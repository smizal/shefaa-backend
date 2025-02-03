const db = require('../config/db')
const bcrypt = require('bcrypt')
const SALT = process.env.SALT ? +process.env.SALT : 12
const { cloudinary } = require('../config/cloudinary')

const index = async (req, res) => {
  try {
    if (!db.checkPermission(req.loggedUser.user.role, ['admin'])) {
      res
        .status(200)
        .json({ error: 'You are not authorized to get in this page' })
    }
    const users = await db.query(
      `SELECT id, name, photopath, cpr, email, phone, role, status FROM users`
    )
    if (!users.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    res.status(200).json(users.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    if (!db.checkPermission(req.loggedUser.user.role, ['admin'])) {
      res
        .status(200)
        .json({ error: 'You are not authorized to get in this page' })
    }
    const users = await db.query(
      `SELECT id, name, photopath, cpr, username, email, phone, role, status, notes FROM users WHERE id=${req.params.id}`
    )
    if (!users.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    res.status(200).json(users.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const create = async (req, res) => {
  try {
    if (!db.checkPermission(req.loggedUser.user.role, ['admin'])) {
      res
        .status(200)
        .json({ error: 'You are not authorized to get in this page' })
    }

    const newUser = req.body
    if (
      !newUser.name ||
      !newUser.username ||
      !newUser.password ||
      !newUser.cpr ||
      !newUser.email ||
      !newUser.role
    ) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    // check password match
    if (newUser.password !== newUser.confirmPassword) {
      return res.status(200).json({ error: 'Passwords are not matched.' })
    }
    // check username
    const usernameExist = await db.query(
      `SELECT id FROM users WHERE username='${newUser.username}'`
    )
    if (usernameExist.rows.length) {
      return res.status(409).json({ error: 'Username already taken.' })
    }

    // check cpr
    const userCPRExist = await db.query(
      `SELECT id FROM users WHERE cpr='${newUser.cpr}'`
    )
    if (userCPRExist.rows.length) {
      return res
        .status(409)
        .json({ error: 'A User with same CPR already created.' })
    }

    // encode password and save user data
    newUser.password = bcrypt.hashSync(newUser.password, SALT)
    if (req.file) {
      newUser.photopath = req.file.path
      newUser.photoId = req.file.filename
    } else {
      newUser.photopath = ''
      newUser.photoId = ''
    }
    const user =
      await db.query(`INSERT INTO users (name, photopath, photoid, cpr, username, password, email, phone, notes, role) VALUES (
          '${newUser.name}',
          '${newUser.photopath}',
          '${newUser.photoId}',
          '${newUser.cpr}',
          '${newUser.username}',
          '${newUser.password}',
          '${newUser.email}',
          '${newUser.phone}',
          '${newUser.notes}',
          '${newUser.role}'
          ) RETURNING id, name, photopath, cpr, username, email, phone, role, status, notes`)
    if (user.rows.length) {
      res.status(201).json(user.rows[0])
    } else {
      res.status(200).json({ error: 'Error saving user data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const update = async (req, res) => {
  try {
    let user = null
    if (req.loggedUser.user.role === 'super') {
      user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true
      })
    } else {
      user = await User.findOneAndUpdate(
        {
          _id: req.params.id,
          companyId: req.loggedUser.user.companyId
        },
        req.body,
        {
          new: true
        }
      )
    }
    if (!user) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleting = async (req, res) => {
  try {
    let user = null
    const ticket = await Ticket.find({
      $or: [{ customerId: req.params.id }, { issuerId: req.params.id }]
    })

    if (ticket) {
      if (req.loggedUser.user.role === 'super' && ticket.length > 0) {
        user = await User.findByIdAndUpdate(req.params.id, {
          status: 'suspended'
        })
        if (!user) {
          return res.status(200).json({ error: 'Error suspending user.' })
        }
        return res
          .status(201)
          .json({ error: 'User has tickets. it is suspended only' })
      } else if (ticket.length > 0) {
        user = await User.findOneAndUpdate(
          {
            _id: req.params.id,
            companyId: req.loggedUser.user.companyId
          },
          { status: 'suspended' }
        )
        if (!user) {
          return res.status(200).json({ error: 'Error suspending user.' })
        } else {
          return res
            .status(201)
            .json({ error: 'User has tickets. it is suspended only' })
        }
      }
    }

    if (req.loggedUser.user.role === 'super') {
      user = await User.findByIdAndDelete(req.params.id)
    } else {
      user = await User.findOneAndDelete({
        _id: req.params.id,
        companyId: req.loggedUser.user.companyId
      })
    }
    if (!user) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { index, show, create, update, deleting }
