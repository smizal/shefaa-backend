const db = require('../config/db')
const bcrypt = require('bcrypt')
const SALT = process.env.SALT ? +process.env.SALT : 12
const { cloudinary } = require('../config/cloudinary')
const show = async (req, res) => {
  try {
    let foundedUser = await db.query(
      `SELECT name, photoPath, photoId, email, phone FROM users WHERE id=${req.loggedUser.user.id}`
    )
    if (!foundedUser.rows.length) {
      return res.status(404).json({ error: 'Bad request.' })
    }
    const user = foundedUser.rows
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const update = async (req, res) => {
  try {
    const userExist = await db.query(
      `SELECT photoId FROM users WHERE id=${req.loggedUser.user.id}`
    )

    const oldPhotoId = userExist.rows[0].photoid
      ? userExist.rows[0].photoid
      : ''
    console.log('photoid: ', userExist.rows[0].photoid)
    console.log('oldPhotoId: ', oldPhotoId)

    let formData = req.body
    let newPass = ''
    let newPhotoPath = ''
    let newPhotoId = ''

    if (formData.password) {
      formData.password = bcrypt.hashSync(formData.password, SALT)
      newPass = `, password='${formData.password}'`
    } else {
      delete formData.password
    }

    if (req.file) {
      newPhotoId = `, photoId='${req.file.filename}'`
      newPhotoPath = `, photoPath='${req.file.path}'`
    }

    const query = `UPDATE users set name='${formData.name}', phone='${formData.phone}', email='${formData.email}'${newPass}${newPhotoPath}${newPhotoId} WHERE id=${req.loggedUser.user.id} RETURNING name, photoPath, photoId, email, phone`

    const user = await db.query(query)

    if (!user.rows.length) {
      return res.status(200).json({ error: 'Failed to update user data.' })
    }

    if (oldPhotoId) {
      cloudinary.uploader.destroy(oldPhotoId).then((result) => {
        console.log(result)
      })
    }
    newUser = user.rows[0]
    res.status(200).json(newUser)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { show, update }
