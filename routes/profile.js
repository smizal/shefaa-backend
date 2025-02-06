const express = require('express')

const { storage } = require('../config/cloudinary')
storage.params.folder = 'shefaa/users'

const multer = require('multer')
const upload = multer({ storage })

const { show, update } = require('../controllers/profile.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', show)
router.put('/', upload.single('photo'), update)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
