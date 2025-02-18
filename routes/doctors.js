const express = require('express')

const {
  index,
  show,
  create,
  deleting,
  getServices,
  getOtherServices
} = require('../controllers/doctors.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.post('/:id', create)
router.delete('/:id/:srvId', deleting)
router.get('/otherServices/:id', getOtherServices)
router.get('/services/:id', getServices)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
