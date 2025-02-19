const db = require('../config/db')

const error404 = async (req, res) => {
  try {
    const insertion = await db.query(
      `ALTER TABLE medicinesRequests ALTER COLUMN period TYPE VARCHAR;`
    )
    console.log(insertion)
    message = 'You are trying to enter in non-exist page!'
    res.status(200).json({ error: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { error404 }
