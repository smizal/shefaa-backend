const db = require('../config/db')
const bcrypt = require('bcrypt')
const SALT = process.env.SALT ? +process.env.SALT : 12
const { cloudinary } = require('../config/cloudinary')

const index = async (req, res) => {
  try {
    let date = ''
    if (req.params.start) {
      date = `WHERE a.appointmentdate BETWEEN '${req.params.start} 00:00:00' AND `
      if (req.params.end) {
        date += `'${req.params.end} 23:59:59'`
      } else {
        date += `'${req.params.start} 23:59:59'`
      }
    } else {
      const today = new Date().toISOString().split('T')[0]
      date = `WHERE a.appointmentdate BETWEEN '${today} 00:00:00' AND '${today} 23:59:59'`
    }

    const appointments =
      await db.query(`SELECT a.id id, a.appointmentdate date, a.status status, s.title service, s.id serviceId, s.duration duration, s.description description, u.id docId, u.name doctor, s.duration duration, pu.id patientId, pu.name patientName FROM appointments a 
        JOIN services s ON s.id = a.serviceid
        JOIN users u ON u.id = a.doctorid
        JOIN users pu ON pu.id = a.patientid ${date} AND a.status != 'rejected'`)
    if (!appointments.rows.length) {
      return res.status(200).json({ error: 'No appointments!' })
    }
    message = 'Appointments fetched successfully'
    res.status(200).json({ appointments: appointments.rows, message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    const appointment = await db.query(
      `SELECT a.id id, a.appointmentdate date, a.status status, s.title service, s.duration duration, s.description description, u.id docId, u.name doctor, s.duration duration, pu.id patientId, pu.name patientName FROM appointments a 
        JOIN services s ON s.id = a.serviceid
        JOIN users u ON u.id = a.doctorid
        JOIN users pu ON pu.id = a.patientid
        WHERE a.id=${req.params.id}`
    )
    if (!appointment.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    message = 'Appointment details fetched successfully'
    res.status(200).json({ appointment: appointment.rows[0], message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const create = async (req, res) => {
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
    const source = 'internal'

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
    const newApp =
      await db.query(`INSERT INTO appointments (patientId, serviceId, doctorId, appointmentDate, description, status) VALUES (
        '${patientId}',
        '${postData.serviceId}',
        '${postData.doctorId}',
        '${postData.appointmentDate}',
        '${postData.description ? postData.description : ''}',
        'approved'
        ) RETURNING id`)
    if (!newApp.rows.length) {
      return res.status(200).json({ error: 'Error saving appointment data.' })
    }
    const appointment = await db.query(
      `SELECT a.id id, a.appointmentdate date, a.status status, s.title service, s.duration duration, s.description description, u.id docId, u.name doctor, s.duration duration, pu.id patientId, pu.name patientName FROM appointments a 
        JOIN services s ON s.id = a.serviceid
        JOIN users u ON u.id = a.doctorid
        JOIN users pu ON pu.id = a.patientid
        WHERE a.id=${newApp.rows[0].id}`
    )
    res.status(201).json({
      appointment: appointment.rows[0],
      message: 'Appointment request saved successfully'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const update = async (req, res) => {
  console.log(req.body)
  console.log(req.params.id)

  try {
    const status = await db.query(
      `SELECT status FROM appointments where id=${req.params.id}`
    )
    if (!status.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    } else if (status.rows[0].status !== 'new') {
      return res.status(401).json({
        error: `Only new appointments can be updated. this appointment status is ${status.rows[0].status}`
      })
    }

    const newData = req.body
    /* if (!newData.serviceId || !newData.doctorId || !newData.appointmentDate) {
      return res.status(200).json({ error: 'Missing required fields.' })
    } */

    const updatedAt = new Date().toISOString()
    // const query = `UPDATE appointments SET serviceId='${newData.serviceId}', doctorId='${newData.doctorId}', appointmentDate='${newData.appointmentDate}', description='${newData.description}', updatedat='${updatedAt}' WHERE id=${req.params.id} RETURNING id`
    let query = `UPDATE appointments SET `
    let first = true
    for (const [key, value] of Object.entries(newData)) {
      if (!first) {
        query += ', '
      }
      query += `${key}='${value}'`
      first = false
    }
    query += `, updatedat='${updatedAt}' WHERE id=${req.params.id} RETURNING id`

    const updateApp = await db.query(query)
    if (updateApp.rows.length) {
      const appointment = await db.query(
        `SELECT a.id id, a.appointmentdate date, a.status status, s.title service, s.duration duration, s.description description, u.id docId, u.name doctor, s.duration duration, pu.id patientId, pu.name patientName FROM appointments a 
          JOIN services s ON s.id = a.serviceid
          JOIN users u ON u.id = a.doctorid
          JOIN users pu ON pu.id = a.patientid
          WHERE a.id=${req.params.id}`
      )
      message = 'Appointment updated successfully'
      res
        .status(201)
        .json({ appointment: appointment.rows[0], message: message })
    } else {
      res.status(200).json({ error: 'Error saving service data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateStatus = async (req, res) => {
  try {
    const status = await db.query(
      `SELECT status FROM appointments where id=${req.params.id}`
    )
    if (!status.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    } else if (
      status.rows[0].status !== 'new' &&
      status.rows[0].status !== 'approved'
    ) {
      return res.status(401).json({
        error: `Cannot change appointment status. this appointment status is ${status.rows[0].status}`
      })
    }
    let query = ''
    const newStatus = req.body.status
    if (newStatus !== 'delete') {
      const updatedAt = new Date().toISOString()
      query = `UPDATE appointments SET status='${newStatus}', updatedat='${updatedAt}' WHERE id=${req.params.id} RETURNING id`
    } else {
      query = `DELETE FROM appointments WHERE id=${req.params.id} RETURNING id`
    }
    const updateApp = await db.query(query)
    if (updateApp.rows.length) {
      const appointment = await db.query(
        `SELECT a.id id, a.appointmentdate date, a.status status, s.title service, s.duration duration, s.description description, u.id docId, u.name doctor, s.duration duration, pu.id patientId, pu.name patientName FROM appointments a 
          JOIN services s ON s.id = a.serviceid
          JOIN users u ON u.id = a.doctorid
          JOIN users pu ON pu.id = a.patientid
          WHERE a.id=${req.params.id}`
      )
      message = 'Appointment updated successfully'
      res
        .status(201)
        .json({ appointment: appointment.rows[0], message: message })
    } else {
      res.status(200).json({ error: 'Error saving service data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleting = async (req, res) => {
  try {
    appId = req.params.id

    const appExist = await db.query(
      `SELECT status FROM appointments where id=${appId}`
    )
    if (!appExist.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    }

    if (appExist.rows[0].status !== 'new') {
      return res.status(401).json({
        error: `Only new appointments can be deleted. this appointment status is ${appExist.rows[0].status}`
      })
    }

    const deletedApp = await db.query(
      `DELETE FROM appointments WHERE id=${appId}`
    )
    message = 'Appointment deleted successfully'

    res.status(200).json({
      message: message
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getOtherDoctors = async (req, res) => {
  try {
    const query = `SELECT id, name FROM users WHERE status='active' AND id NOT IN (SELECT ds.doctorid FROM doctorsServices ds JOIN services s ON s.id = ds.doctorid WHERE serviceid=${req.params.id})`
    console.log(query)

    const srvDoctors = await db.query(query)
    if (!srvDoctors.rows.length) {
      return res
        .status(404)
        .json({ error: 'No new services to be attached for this doctor.' })
    }
    message = 'Service doctors fetched successfully'
    res.status(200).json({ srvDoctors: srvDoctors.rows, message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const addDoctor = async (req, res) => {
  try {
    const newDoctors = req.body

    if (!newDoctors.doctors) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    let message = ''
    // await newDoctors.doctors.forEach(async (docId) => {
    for (const docId of newDoctors.doctors) {
      const exist = await db.query(
        `SELECT id FROM doctorsServices WHERE serviceid=${req.params.id} AND doctorid=${docId}`
      )

      if (exist.rows.length > 0) {
        message += message !== '' ? ', ' : 'Doctor(s) with id(s): '
        message += `${docId}`
        // message = 'Some doctors are already attached to the service!'
      } else {
        await db.query(
          `INSERT INTO doctorsServices (doctorid, serviceid) VALUES (${docId},${req.params.id})`
        )
      }
    }
    // })

    message +=
      message === ''
        ? 'All doctors attached successfully'
        : ' is/are already attached to the service!'
    const srvDoctors = await db.query(
      `SELECT u.id, ds.status, u.name FROM doctorsServices ds 
      JOIN users u ON u.id = ds.doctorid
      WHERE serviceid=${req.params.id}`
    )
    if (!srvDoctors.rows.length) {
      return res
        .status(404)
        .json({ error: 'No attached services for this doctor.' })
    }
    res.status(200).json({ doctors: srvDoctors.rows, message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleteDoctor = async (req, res) => {
  try {
    doctorId = req.params.docId
    srvId = req.params.id

    const docSrvId = await db.query(
      `DELETE FROM doctorsServices WHERE doctorid= ${doctorId} AND serviceid=${srvId} RETURNING id`
    )

    if (!docSrvId.rows.length) {
      return res
        .status(404)
        .json({ error: 'Error deleting service from the doctor.' })
    }
    const otherDoctors = await db.query(
      `SELECT ds.id, ds.status, u.name FROM doctorsServices ds 
      JOIN users u ON u.id = ds.doctorid
      WHERE serviceid=${req.params.id}`
    )
    if (!otherDoctors.rows.length) {
      return res.status(404).json({ error: 'Error loading data.' })
    }
    message = 'Service doctor deleted successfully'
    res.status(200).json({ otherDoctors: otherDoctors.rows, message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
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

const getDoctors = async (req, res) => {
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
const appByDoctor = async (req, res) => {
  try {
    let date = ''
    if (req.params.start) {
      date = `WHERE a.appointmentdate BETWEEN '${req.params.start} 00:00:00' AND `
      if (req.params.end) {
        date += `'${req.params.end} 23:59:59'`
      } else {
        date += `'${req.params.start} 23:59:59'`
      }
    } else {
      const today = new Date().toISOString().split('T')[0]
      date = `WHERE a.appointmentdate BETWEEN '${today} 00:00:00' AND '${today} 23:59:59'`
    }
    date += ` AND a.doctorid=${req.params.id}`
    const appointments =
      await db.query(`SELECT a.id id, a.appointmentdate date, a.status status, s.title service, s.duration duration, s.description description, u.id docId, u.name doctor, s.duration duration, pu.id patientId, pu.name patientName FROM appointments a 
        JOIN services s ON s.id = a.serviceid
        JOIN users u ON u.id = a.doctorid
        JOIN users pu ON pu.id = a.patientid ${date}`)
    if (!appointments.rows.length) {
      return res.status(200).json({ error: 'No appointments!' })
    }
    message = 'Appointments fetched successfully'
    res.status(200).json({ appointments: appointments.rows, message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  deleting,
  appByDoctor,
  getServices,
  getDoctors,
  updateStatus
}
