const express = require('express')
const { storage } = require('../config/cloudinary')
storage.params.folder = 'shefaa/users'

const multer = require('multer')
const upload = multer({ storage })

const {
  index,
  show,
  create,
  update,
  deleting,
  byTypeList
} = require('../controllers/users.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.post('/', upload.single('photo'), create)
router.put('/:id', upload.single('photo'), update)
router.delete('/:id', deleting)
router.get('/type/:name', byTypeList)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
