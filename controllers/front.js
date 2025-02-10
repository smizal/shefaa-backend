require('dotenv').config()
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
    // Get patient ID
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

    // Save Appointment Data
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
    res.status(201).json({ message: 'Appointment request saved successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const dashboard = async (req, res) => {
  try {
    const appointments =
      await db.query(`SELECT a.id id, a.appointmentdate date, a.status status, s.title service, u.name doctor FROM appointments a
      JOIN services s ON s.id = a.serviceid
      JOIN users u ON u.id = a.doctorid
      WHERE a.status !='rejected'
      AND a.patientId = ${req.loggedUser.user.id}`)
    if (!appointments.rows.length) {
      return res.status(200).json({ error: 'No appointments for this user!' })
    }
    message = 'Appointments fetched successfully'
    res.status(200).json({ appointments: appointments.rows, message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    const appointment =
      await db.query(`SELECT a.id id, a.appointmentdate date, a.status status, s.title service, u.name doctor FROM appointments a
      JOIN services s ON s.id = a.serviceid
      JOIN users u ON u.id = a.doctorid
      WHERE a.status !='rejected'
      AND a.patientId = ${req.loggedUser.user.id}
      AND a.id = ${req.params.id}`)
    if (!appointment.rows.length) {
      return res.status(200).json({ error: 'Bad request.' })
    }
    const appid = appointment.rows[0].id
    let medications = []
    let labs = []
    let invoice = []
    let prescription = []
    if (
      appointment.rows[0].status === 'complete' ||
      appointment.rows[0].status === 'invoiced'
    ) {
      const lab =
        await db.query(`SELECT lr.id id, lr.resultPath result, lr.status status, lt.title title FROM labRequests lr
        JOIN labTests lt ON lt.id = lr.diagnosticId
        WHERE lr.status !='rejected'
        AND lr.appointmentId = ${appid}`)
      labs = lab.rows

      const med =
        await db.query(`SELECT mr.id id, mr.period period, mr.dosage dosage, md.name title FROM medicinesRequests mr
        JOIN medicines md ON md.id = mr.medicineId
        WHERE mr.status !='rejected'
        AND mr.appointmentId = ${appid}`)
      medications = med.rows

      const inv = await db.query(
        `SELECT id, amount, status FROM invoices WHERE appointmentId = ${appid}`
      )
      invoice = inv.rows

      const pres =
        await db.query(`SELECT p.casehistory, p.medication, i.name icdname, i.code icdcode FROM prescriptions p
        JOIN icd i ON i.id=p.icdid
        WHERE appointmentId = ${appid}`)
      if (pres) {
        prescription = pres.rows
      }
    }

    message = 'Appointment data fetched successfully'
    res.status(200).json({
      appointments: appointment.rows[0],
      medications,
      labs,
      invoice,
      prescription,
      message
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const medicines = async (req, res) => {
  try {
    const appid = req.params.id
    const medications =
      await db.query(`SELECT mr.id id, mr.period period, mr.dosage dosage, md.name title FROM medicinesRequests mr
        JOIN medicines md ON md.id = mr.medicineId
        JOIN appointments a ON a.id = mr.appointmentId
        WHERE mr.status !='rejected'
        AND a.patientId = ${req.loggedUser.user.id}
        AND mr.appointmentId = ${appid}`)

    if (!medications.rows.length) {
      return res
        .status(200)
        .json({ error: 'No medication for this appointment.' })
    }
    message = 'Medications fetched successfully'
    medications = medications.rows
    res.status(200).json({ medications, message })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const showInvoice = async (req, res) => {
  try {
    const appid = req.params.id
    const inv = await db.query(
      `SELECT i.id, i.amount, i.status, i.data, u.name FROM invoices i
      JOIN appointments a ON a.id = i.appointmentId
      JOIN users u on u.id = i.issuerid
      WHERE appointmentId = ${appid}
      AND a.patientId = ${req.loggedUser.user.id}`
    )

    if (!inv.rows.length) {
      return res.status(200).json({ error: 'No invoice for this appointment.' })
    }
    message = 'Invoice fetched successfully'
    invoice = inv.rows
    res.status(200).json({ invoice, message })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getServices = async (req, res) => {
  try {
    const services = await db.query(
      `SELECT id, title FROM services WHERE status='active'`
    )
    message = 'Services fetched successfully'
    res.status(400).json({ services: services.rows, message })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getSrvDoctors = async (req, res) => {
  try {
    const doctors = await db.query(
      `SELECT u.id, u.name FROM users u
      JOIN doctorsServices ds ON u.id=ds.doctorId
      WHERE u.status='active' AND ds.status='active' AND u.role='doctor' AND ds.serviceId='${req.params.srvId}'`
    )
    message = 'Doctors fetched successfully'
    res.status(400).json({ doctors: doctors.rows, message })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getDoctors = async (req, res) => {
  try {
    const doctors = await db.query(
      `SELECT u.id, u.name FROM users u
      WHERE u.status='active' AND u.role='doctor'`
    )
    message = 'Doctors fetched successfully'
    res.status(200).json({ doctors: doctors.rows, message })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  contactUs,
  saveAppointment,
  dashboard,
  show,
  medicines,
  showInvoice,
  getServices,
  getDoctors,
  getSrvDoctors
}
