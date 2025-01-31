require('dotenv').config()
const { cloudinary, storage } = require('../config/cloudinary')
const db = require('../config/db')
const { sendEmail } = require('../config/email')
const bcrypt = require('bcrypt')

const SALT = process.env.SALT ? +process.env.SALT : 12

const contactUs = async (req, res) => {
  try {
    const postData = req.body
    if (
      !postData.name ||
      !postData.phone ||
      !postData.email ||
      !postData.title ||
      !postData.message
    ) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }
    const from = process.env.FROM_EMAIL
    const to = process.env.FROM_EMAIL
    const subject = `Shefaa: ${postData.title}`
    const text = `name: ${postData.name} - Phone: ${postData.phone} - Email: ${postData.email}- Message: ${postData.message}`
    const html = `<b>Name</b>: ${postData.name}<br /><br />
    <b>Phone</b>: ${postData.phone}<br /><br />
    <b>Email</b>: ${postData.email}<br /><br />
    <b>Message</b>: ${postData.message}<br />`
    await sendEmail(from, to, subject, text, html)
    res
      .status(201)
      .json({ message: 'Message sent. Thank you for contacting us.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const saveAppointment = async (req, res) => {
  try {
    const postData = req.body
    if (
      !postData.name ||
      !postData.cpr ||
      !postData.phone ||
      !postData.email ||
      !postData.serviceId ||
      !postData.doctorId ||
      !postData.appointmentDate
    ) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    const userExist = await db.query(
      `SELECT id FROM users WHERE cpr='${postData.cpr}'`
    )
    let patientId = 0
    const source = 'web'
    if (userExist.rows.length) {
      patientId = userExist.rows[0].id
    } else {
      const hashedPassword = bcrypt.hashSync(postData.cpr, SALT)
      const newUser =
        await db.query(`INSERT INTO users (name, cpr, username, password, email, phone) VALUES (
      '${postData.name}',
      '${postData.cpr}',
      '${postData.cpr}',
      '${hashedPassword}',
      '${postData.email}',
      '${postData.phone}'
      ) RETURNING id`)
      if (newUser.rows.length) {
        patientId = newUser.rows[0].id
      } else {
        res.status(200).json({ error: 'Error saving patient data' })
      }
    }

    const appointment =
      await db.query(`INSERT INTO appointments (patientId, serviceId, doctorId, appointmentDate, description) VALUES (
      '${patientId}',
      '${postData.serviceId}',
      '${postData.doctorId}',
      '${postData.appointmentDate}',
      '${postData.description ? postData.description : ''}'
      ) RETURNING id`)
    if (!appointment.rows.length) {
      return res.status(200).json({ error: 'Error saving appointment data.' })
    }
    res.status(201).json({ message: 'Appointment saved successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const ticketList = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      customerId: req.loggedUser.user._id
    }).populate('companyId departmentId')
    if (!tickets) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    res.status(200).json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    const ticket = await Ticket.find({
      _id: req.params.id
      // customerId: req.loggedUser.user._id
    }).populate('companyId departmentId customerId issuerId')
    if (!ticket) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    const threads = await Thread.find({ ticketId: req.params.id })
      .sort({
        createdAt: 1
      })
      .populate('issuerId')
    res.status(200).json({ ticket, threads })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const register = async (req, res) => {
  try {
    const postData = req.body
    if (
      !postData.companyName ||
      !postData.companyPhone ||
      !postData.companyEmail ||
      !postData.companyCr ||
      !postData.address ||
      !postData.adminName ||
      !postData.adminEmail ||
      !postData.adminPhone ||
      !postData.username ||
      !postData.password ||
      !postData.cpr
    ) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    const companyExist = await Company.findOne({ cr: postData.companyCr })
    if (companyExist) {
      return res.status(200).json({ error: 'Company already registered.' })
    }

    const usernameExist = await User.findOne({ cpr: postData.cpr })
    if (usernameExist && usernameExist.companyId) {
      return res
        .status(200)
        .json({ error: 'Username already registered with other company.' })
    }

    const newCompany = {
      name: postData.companyName,
      phone: postData.companyPhone,
      email: postData.companyEmail,
      address: postData.address,
      cr: postData.companyCr,
      photo: postData.photo
    }
    const company = await Company.create(newCompany)

    const hashedPassword = bcrypt.hashSync(postData.password, SALT)
    const newUser = {
      name: postData.adminName,
      username: postData.username,
      password: hashedPassword,
      phone: postData.adminPhone,
      cpr: postData.cpr,
      email: postData.adminEmail,
      role: 'admin',
      status: 'pending',
      companyId: company._id
    }
    const user = await User.create(newUser)

    res.status(200).json({ company, user })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const addThread = async (req, res) => {
  try {
    const ticket = await Ticket.find({
      _id: req.params.id,
      customerId: req.loggedUser.user._id
    })

    if (!ticket) {
      return res.status(200).json({ error: 'Bad request.' })
    }

    await Ticket.findByIdAndUpdate(req.params.id, {
      status: req.body.ticketStatus
    })
    req.body.ticketId = req.params.id
    req.body.issuerId = req.loggedUser.user._id
    req.body.status = 'active'

    const thread = Thread.create(req.body)
    res.status(200).json(thread)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const companiesList = async (req, res) => {
  try {
    const companies = await Company.find({})
    if (!companies) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    res.status(200).json(companies)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const companyDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ companyId: req.params.id })
    if (!departments) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    res.status(200).json(departments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  contactUs,
  saveAppointment,
  ticketList,
  show,
  register,
  addThread,
  companiesList,
  companyDepartments
}
