const db = require('../config/db')

const index = async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, name, photopath, cpr, email, phone, role, status FROM users WHERE role='doctor'`
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
    const docServices = await db.query(
      `SELECT ds.id, ds.status, s.title FROM doctorsServices ds 
      JOIN services s ON s.id = ds.serviceId
      WHERE doctorId=${req.params.id}`
    )
    if (!docServices.rows.length) {
      return res
        .status(404)
        .json({ error: 'No attached services for this doctor.' })
    }
    res.status(200).json(docServices.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const create = async (req, res) => {
  try {
    const newServices = req.body

    if (!newServices.services) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    newServices.services.forEach((srvId) => {
      db.query(
        `INSERT INTO doctorsServices (doctorid, serviceid) VALUES (${req.params.id},${srvId})`
      )
    })

    const docServices = await db.query(
      `SELECT ds.id, ds.status, s.title FROM doctorsServices ds 
      JOIN services s ON s.id = ds.serviceId
      WHERE doctorId=${req.params.id}`
    )
    if (!docServices.rows.length) {
      return res
        .status(404)
        .json({ error: 'No attached services for this doctor.' })
    }
    res.status(200).json(docServices.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleting = async (req, res) => {
  try {
    doctorId = req.params.id
    srvId = req.params.srvId

    const docSrvId = await db.query(
      `DELETE FROM doctorsServices WHERE doctorid= ${doctorId} AND serviceid=${srvId} RETURNING id`
    )

    if (!docSrvId.rows.length) {
      return res
        .status(404)
        .json({ error: 'Error deleting service from the doctor.' })
    }
    const docServices = await db.query(
      `SELECT ds.id, ds.status, s.title FROM doctorsServices ds 
      JOIN services s ON s.id = ds.serviceId
      WHERE doctorId=${req.params.id}`
    )
    if (!docServices.rows.length) {
      return res
        .status(404)
        .json({ error: 'No attached services for this doctor.' })
    }
    res.status(200).json(docServices.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getOtherServices = async (req, res) => {
  try {
    const query = `SELECT id, title FROM services WHERE status='active' AND id NOT IN (SELECT ds.serviceid FROM doctorsServices ds JOIN services s ON s.id = ds.serviceId WHERE doctorId=${req.params.id})`
    console.log(query)

    const docServices = await db.query(query)
    if (!docServices.rows.length) {
      return res
        .status(404)
        .json({ error: 'No new services to be attached for this doctor.' })
    }
    res.status(200).json(docServices.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { index, show, create, deleting, getOtherServices }
