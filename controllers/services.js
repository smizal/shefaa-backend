const db = require('../config/db')

const index = async (req, res) => {
  try {
    const services = await db.query(
      `SELECT id, title, price, duration, description, status FROM services`
    )
    if (!services.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    message = 'List of services fetched successfully'
    res.status(200).json({ services: services.rows, message: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    const service = await db.query(
      `SELECT id, title, price, duration, description, status, notes FROM services WHERE id=${req.params.id}`
    )
    if (!service.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }

    const srvDoctors =
      await db.query(`SELECT u.id, ds.status, u.name FROM doctorsServices ds 
      JOIN users u ON u.id = ds.doctorid
      WHERE serviceid=${req.params.id}`)
    message = 'Service details fetched successfully'
    res.status(200).json({
      service: service.rows[0],
      doctors: srvDoctors.rows,
      message: message
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const create = async (req, res) => {
  try {
    console.log(req.body)
    const newData = req.body
    if (!newData.title || !newData.price || !newData.duration) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    // check title
    const serviceExist = await db.query(
      `SELECT id FROM services WHERE title='${newData.title}'`
    )
    if (serviceExist.rows.length) {
      return res
        .status(409)
        .json({ error: 'A service with same title already created.' })
    }

    const service =
      await db.query(`INSERT INTO services (title, price, duration, description) VALUES (
          '${newData.title}',
          '${newData.price}',
          '${newData.duration}',
          '${newData.description}'
          ) RETURNING id, title, price, duration, description, status`)
    if (service.rows.length) {
      message = 'Service created successfully'
      res.status(201).json({ service: service.rows[0], message: message })
    } else {
      res.status(200).json({ error: 'Error saving service data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const update = async (req, res) => {
  try {
    const oldService = await db.query(
      `SELECT id FROM services where id=${req.params.id}`
    )
    if (!oldService.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    }

    const newData = req.body
    if (!newData.title || !newData.price || !newData.duration) {
      return res.status(200).json({ error: 'Missing required fields.' })
    }

    // check title
    const serviceExist = await db.query(
      `SELECT id FROM services WHERE title='${newData.title}' AND id!=${req.params.id}`
    )
    if (serviceExist.rows.length) {
      return res
        .status(409)
        .json({ error: 'A service with same title already created.' })
    }

    const updatedAt = new Date().toISOString()
    const query = `UPDATE services SET title='${newData.title}', price='${newData.price}', duration='${newData.duration}', description='${newData.description}', notes='${newData.notes}', updatedat='${updatedAt}' WHERE id=${req.params.id} RETURNING id, title, price, duration, description, status`
    console.log(query)

    const service = await db.query(query)

    for (const docId of newData.doctors) {
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

    if (service.rows.length) {
      message = 'Service updated successfully'
      res.status(201).json({ service: service.rows[0], message: message })
    } else {
      res.status(200).json({ error: 'Error saving service data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deleting = async (req, res) => {
  try {
    srvId = req.params.id
    console.log(srvId)

    const existService = await db.query(
      `SELECT id FROM services where id=${srvId}`
    )
    if (!existService.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    }

    let fineToDelete = true
    let message = ''

    const appCount = await db.query(
      `SELECT COUNT(id) FROM appointments WHERE serviceid=${srvId}`
    )
    console.log(appCount)
    if (appCount.rows[0].count > 0) {
      fineToDelete = false
      message = 'Service attached to registered appointments'
    }

    if (fineToDelete) {
      const docSrvCount = await db.query(
        `SELECT COUNT(id) FROM doctorsServices WHERE serviceid=${srvId}`
      )
      if (docSrvCount.rows[0].count > 0) {
        fineToDelete = false
        message = 'service has doctors attached'
      }
    }

    let deletedSrv
    if (fineToDelete) {
      deletedSrv = await db.query(
        `DELETE FROM services WHERE id=${srvId} RETURNING id, title, price, duration, description, status`
      )
      message = 'Service deleted successfully'
    } else {
      const updatedAt = new Date().toISOString()
      deletedSrv = await db.query(
        `UPDATE services SET status='suspended', updatedat='${updatedAt}' WHERE id=${srvId} RETURNING id, title, price, duration, description, status`
      )
      message += ', service suspended only'
    }
    res.status(200).json({
      user: deletedSrv.rows[0],
      message: message
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getOtherDoctors = async (req, res) => {
  try {
    const query = `SELECT id, name FROM users WHERE status='active' AND id NOT IN (SELECT ds.doctorid FROM doctorsServices ds JOIN services s ON s.id = ds.doctorid WHERE serviceid=${req.params.id}) and role='doctor'`
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

module.exports = {
  index,
  show,
  create,
  update,
  deleting,
  addDoctor,
  deleteDoctor,
  getOtherDoctors
}
