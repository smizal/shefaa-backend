const express = require('express')

const {
  index,
  show,
  create,
  deleting,
  getOtherServices
} = require('../controllers/doctors.js')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.post('/:id', create)
router.delete('/:id/:srvId', deleting)
router.get('/services/:id', getOtherServices)

module.exports = router
