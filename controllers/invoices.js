const db = require('../config/db')
const bcrypt = require('bcrypt')
const SALT = process.env.SALT ? +process.env.SALT : 12
const { cloudinary } = require('../config/cloudinary')

const index = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    date = `WHERE i.updatedat BETWEEN '${today} 00:00:00' AND '${today} 23:59:59'`

    const unpaidApps =
      await db.query(`SELECT a.id id, a.appointmentdate date, s.title service, u.name doctor, pu.name patientName FROM appointments a 
        JOIN services s ON s.id = a.serviceid
        JOIN users u ON u.id = a.doctorid
        JOIN users pu ON pu.id = a.patientid AND a.status='complete'
        ORDER BY a.appointmentdate DESC`)

    const paidApps =
      await db.query(`SELECT i.id id, a.appointmentdate date, s.title service, u.name doctor, pu.name patientName, i.amount FROM appointments a 
          JOIN services s ON s.id = a.serviceid
          JOIN users u ON u.id = a.doctorid
          JOIN invoices i ON a.id = i.appointmentId
          JOIN users pu ON pu.id = a.patientid ${date} AND a.status='invoiced'`)

    message = 'Appointments fetched successfully'
    res.status(200).json({
      unpaidApps: unpaidApps.rows,
      paidApps: paidApps.rows,
      message: message
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const show = async (req, res) => {
  try {
    const foundedInvoice = await db.query(
      `SELECT id, data, status FROM invoices WHERE appointmentId=${req.params.id}`
    )
    if (foundedInvoice.rows.length > 0) {
      message = 'Ready Invoice'
      res.status(200).json({
        invoice: foundedInvoice.rows[0],
        message: message
      })
    } else {
      const appointment = await db.query(
        `SELECT a.id id, a.appointmentdate date, s.title service, s.price price, u.name doctor, pu.id patientId, pu.cpr cpr, pu.name patientName FROM appointments a 
          JOIN services s ON s.id = a.serviceid
          JOIN users u ON u.id = a.doctorid
          JOIN users pu ON pu.id = a.patientid
          WHERE a.id=${req.params.id}`
      )
      if (!appointment.rows.length) {
        return res.status(404).json({ error: 'Bad request.' })
      }
      const labs =
        await db.query(`SELECT lt.id, lt.title name, lt.price price FROM labTests lt
      JOIN labRequests lr ON lt.id = lr.diagnosticId
      WHERE lr.appointmentId=${req.params.id}`)

      const medicines =
        await db.query(`SELECT m.id, m.name name, m.price price FROM medicines m
        JOIN medicinesrequests mr ON m.id = mr.medicineId
        WHERE mr.appointmentId=${req.params.id}`)

      const data = `{appointment:${JSON.stringify(
        appointment.rows[0]
      )}, labs:${JSON.stringify(labs.rows)}, medicines:${JSON.stringify(
        medicines.rows
      )}}`
      console.log(data)
      const invoice = await db.query(
        `INSERT INTO invoices (appointmentId,issuerId,data,amount) VALUES (${req.params.id}, 1, '${data}', 0.0) RETURNING id, data, status`
      )
      console.log(invoice)
      message = 'Appointment details fetched successfully'
      /* res.status(200).json({
        appointment: appointment.rows[0],
        labs: labs.rows,
        medicines: medicines.rows,
        message: message
      }) */
      res.status(200).json({
        invoice: invoice.rows[0],
        message: message
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateStatus = async (req, res) => {
  try {
    const status = await db.query(
      `SELECT id FROM invoices where appointmentId=${req.params.id}`
    )
    if (!status.rows.length) {
      return res.status(401).json({ error: 'Invalid Data' })
    }
    const newStatus = req.body.status
    const newPrice = req.body.amount

    const updatedAt = new Date().toISOString()
    const updateInv = await db.query(
      `UPDATE invoices SET amount=${newPrice}, status='${newStatus}', updatedat='${updatedAt}' WHERE appointmentId=${req.params.id} RETURNING id, data, status`
    )

    if (updateInv.rows.length) {
      const updateApp = await db.query(
        `UPDATE appointments SET status='invoiced', updatedat='${updatedAt}' WHERE id=${req.params.id} RETURNING id`
      )

      message = 'Invoice updated successfully'
      res.status(201).json({ data: updateInv.rows[0], message: message })
    } else {
      res.status(200).json({ error: 'Error saving service data' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = {
  index,
  show,
  updateStatus
}
