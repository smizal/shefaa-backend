const db = require('../config/db')
const bcrypt = require('bcrypt')
const SALT = process.env.SALT ? +process.env.SALT : 12
const { cloudinary } = require('../config/cloudinary')

const index = async (req, res) => {
  try {
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
    const oldUser = await db.query(
      `SELECT photoid FROM users where id=${req.params.id}`
    )
    if (!oldUser.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    }
    const newUser = req.body
    if (
      !newUser.name ||
      !newUser.username ||
      !newUser.cpr ||
      !newUser.email ||
      !newUser.role
    ) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    // check username
    const usernameExist = await db.query(
      `SELECT id FROM users WHERE username='${newUser.username}' AND id != ${req.params.id}`
    )
    if (usernameExist.rows.length) {
      return res.status(409).json({ error: 'Username already taken.' })
    }

    // check cpr
    const userCPRExist = await db.query(
      `SELECT id FROM users WHERE cpr='${newUser.cpr}' AND id != ${req.params.id}`
    )
    if (userCPRExist.rows.length) {
      return res
        .status(409)
        .json({ error: 'A User with same CPR already created.' })
    }

    // encode password and save user data
    if (newUser.password) {
      // check password match
      if (newUser.password !== newUser.confirmPassword) {
        return res.status(200).json({ error: 'Passwords are not matched.' })
      }
      newUser.password = `, password='${bcrypt.hashSync(
        newUser.password,
        SALT
      )}'`
    } else {
      newUser.password = ''
    }

    if (req.file) {
      newUser.photoPath = `, photopath='${req.file.path}'`
      newUser.photoId = `, photoid='${req.file.filename}'`
    } else {
      newUser.photoPath = ''
      newUser.photoId = ''
    }

    if (!newUser.phone) {
      newUser.phone = ''
    }

    if (!newUser.notes) {
      newUser.notes = ''
    }

    const updatedAt = new Date().toISOString()
    const query = `UPDATE users SET name='${newUser.name}', cpr='${newUser.cpr}', username='${newUser.username}', email='${newUser.email}', phone='${newUser.phone}', role='${newUser.role}', notes='${newUser.notes}', updatedat='${updatedAt}'${newUser.password}${newUser.photoPath}${newUser.photoId} WHERE id=${req.params.id} RETURNING id, name, photopath, cpr, username, email, phone, role, status, notes`
    console.log(query)

    const user = await db.query(query)
    if (oldUser.rows[0].photoid && req.file) {
      cloudinary.uploader.destroy(oldUser.rows[0].photoid).then((result) => {
        console.log(result)
      })
    }
    if (user.rows.length) {
      res.status(201).json(user.rows[0])
    } else {
      res.status(200).json({ error: 'Error saving user data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleting = async (req, res) => {
  try {
    userId = req.params.id
    const existUser = await db.query(
      `SELECT role, photoid FROM users where id=${userId}`
    )
    if (!existUser.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    }
    const oldUser = existUser.rows[0]
    let fineToDelete = true
    let message = ''

    const appCount = await db.query(
      `SELECT COUNT(id) FROM appointments WHERE patientid=${userId}`
    )
    if (appCount.rows[0].count > 0) {
      fineToDelete = false
      message = 'User has registered appointments'
    }

    if (fineToDelete && oldUser.role === 'doctor') {
      const docAppCount = await db.query(
        `SELECT COUNT(id) FROM appointments WHERE doctorid=${userId}`
      )
      if (docAppCount.rows[0].count > 0) {
        fineToDelete = false
        message = 'User (doctor) has registered appointments'
      }
      const docSrvCount = await db.query(
        `SELECT COUNT(id) FROM doctorsServices WHERE doctorid=${userId}`
      )

      if (docSrvCount.rows[0].count > 0) {
        fineToDelete = false
        message = 'User (doctor) has attached services'
      }
    }
    if (fineToDelete && oldUser.role === 'laboratorist') {
      const labCount = await db.query(
        `SELECT COUNT(id) FROM labRequests WHERE reporterid=${userId}`
      )
      if (labCount.rows[0].count > 0) {
        fineToDelete = false
        message = 'User (laboratorist) has attached appointments lab reports'
      }
    }

    if (fineToDelete && oldUser.role === 'pharmacist') {
      const pharmCount = await db.query(
        `SELECT COUNT(id) FROM medicinesRequests WHERE pharmaciestid=${userId}`
      )

      if (pharmCount.rows[0].count > 0) {
        fineToDelete = false
        message = 'User (pharmacist) has attached pharmacy report'
      }
    }

    if (fineToDelete && oldUser.role === 'accountant') {
      const invCount = await db.query(
        `SELECT COUNT(id) FROM invoices WHERE issuerId=${userId}`
      )

      if (invCount.rows[0].count > 0) {
        fineToDelete = false
        message = 'User (accountant) has attached invoices'
      }
    }

    let deletedUser
    if (fineToDelete) {
      deletedUser = await db.query(
        `DELETE FROM users WHERE id=${userId} RETURNING id, name, photopath, cpr, username, email, phone, role, status, notes`
      )
      message = 'User deleted successfully'
    } else {
      const updatedAt = new Date().toISOString()
      deletedUser = await db.query(
        `UPDATE users SET status='suspended', updatedat=${updatedAt} WHERE id=${userId} RETURNING id, name, photopath, cpr, username, email, phone, role, status, notes`
      )
      message += 'account suspended only'
    }
    res.status(200).json({
      user: deletedUser.rows[0],
      message: message
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const byTypeList = async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, name, photopath, cpr, email, phone, role, status FROM users WHERE role='${req.params.name}'`
    )
    if (!users.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    res.status(200).json(users.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { index, show, create, update, deleting, byTypeList }
