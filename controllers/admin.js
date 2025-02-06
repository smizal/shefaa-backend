const db = require('../config/db')

const index = async (req, res) => {
  try {
    const role = req.loggedUser.user.role
    let newApps = []
    let unpaidInvoices = []
    message = 'Data fetched successfully'
    if (role === 'admin') {
      return res.status(200).json({ message: 'Admin Dashboard.' })
    } else if (role === 'doctor') {
      return res.status(200).json({ message: 'doctor Dashboard.' })
    } else if (role === 'receptionist') {
      return res.status(200).json({ message: 'receptionist Dashboard.' })
    } else if (role === 'laboratorist') {
      newApps =
        await db.query(`SELECT a.id, a.appointmentdate, u.name FROM appointments a 
        JOIN users u on u.id=a.patientid
        WHERE a.status ='inprogress' OR  a.status ='complete'`)
      newApps = newApps.rows.length ? newApps.rows : []

      return res.status(200).json({ newApps, message })
    } else if (role === 'pharmacist') {
      newApps =
        await db.query(`SELECT a.id, a.appointmentdate, u.name FROM appointments a 
        JOIN users u on u.id=a.patientid
        WHERE a.status ='inprogress'`)
      newApps = newApps.rows.length ? newApps.rows : []

      return res.status(200).json({ apps, message })
    } else if (role === 'accountant') {
      newApps =
        await db.query(`SELECT a.id, a.appointmentdate, u.name FROM appointments a 
        JOIN users u on u.id=a.patientid
        WHERE a.status='complete'`)
      newApps = newApps.rows.length ? newApps.rows : []

      unpaidInvoices =
        await db.query(`SELECT i.id, i.createdat, u.name FROM invoices i
          JOIN appointments a ON a.id = i.appointmentid
          JOIN users u on u.id=a.patientid
          WHERE i.status='new'`)
      unpaidInvoices = unpaidInvoices.rows.length ? unpaidInvoices.rows : []

      return res.status(200).json({ newApps, unpaidInvoices, message })
    }
    res.status(404).json({ error: 'Bad request.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { index }
