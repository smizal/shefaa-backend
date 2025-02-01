const express = require('express')

const { storage } = require('../config/cloudinary')
storage.params.folder = 'shefaa/users'
console.log(storage)

const multer = require('multer')
const upload = multer({ storage })

const { show, update } = require('../controllers/profile.js')

const router = express.Router()

router.get('/', show)
router.put('/', upload.single('photo'), update)

module.exports = router
