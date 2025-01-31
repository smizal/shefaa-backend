const User = require('../models/usersModel')
const Ticket = require('../models/ticketsModel')
const Department = require('../models/departmentsModel')

const bcrypt = require('bcrypt')
const SALT = process.env.SALT ? +process.env.SALT : 12

const index = async (req, res) => {
  try {
    let users = ''
    if (req.loggedUser.user.role === 'super') {
      users = await User.find().populate('companyId departmentId')
    } else {
      users = await User.find({
        companyId: req.loggedUser.user.companyId
      }).populate('companyId departmentId')
    }
    if (!users) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const create = async (req, res) => {
  try {
    if (req.loggedUser.user.role != 'super') {
      req.body.companyId = req.loggedUser.user.companyId
    }

    const newUser = req.body
    if (
      !newUser.name ||
      !newUser.username ||
      !newUser.password ||
      !newUser.cpr ||
      !newUser.role ||
      (newUser.role === 'staff' && !newUser.departmentId)
    ) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    if (newUser.password !== newUser.confirmPassword) {
      return res.status(200).json({ error: 'Passwords are not matched.' })
    }
    const usernameExist = await User.findOne({ username: newUser.username })
    if (usernameExist) {
      return res.status(409).json({ error: 'Username already taken.' })
    }

    const userCPRExist = await User.findOne({ cpr: newUser.cpr })
    if (userCPRExist) {
      return res
        .status(409)
        .json({ error: 'A User with same CPR already created.' })
    }

    const department = await Department.find({ companyId: newUser.companyId })
    if (!department) {
      return res
        .status(409)
        .json({ error: 'Department is not founded for this company' })
    }

    req.body.password = bcrypt.hashSync(newUser.password, +SALT)

    const user = await User.create(req.body)
    console.log(user)

    if (!user) {
      return res.status(200).json({ error: 'Error saving data.' })
    }
    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const companyUsers = async (req, res) => {
  try {
    let company = req.loggedUser.user.companyId
    if (req.loggedUser.user.role === 'super') {
      company = req.params.id
    }
    const users = await User.find({ companyId: company }).populate(
      'companyId departmentId'
    )
    if (!users) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    let user = ''
    if (req.loggedUser.user.role === 'super') {
      user = await User.findById(req.params.id).populate(
        'companyId departmentId'
      )
    } else {
      user = await User.find({
        _id: req.params.id,
        companyId: req.loggedUser.user.companyId
      }).populate('companyId departmentId')
    }
    if (!user) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    res.status(200).json(user)
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

module.exports = { index, create, companyUsers, show, update, deleting }
