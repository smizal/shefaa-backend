const express = require('express')

const {
  index,
  show,
  create,
  update,
  deleting,
  addDoctor,
  deleteDoctor,
  getOtherDoctors
} = require('../controllers/services.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.get('/otherDoctors/:id', getOtherDoctors)
router.post('/', create)
router.post('/:id', addDoctor)
router.put('/:id', update)
router.delete('/:id', deleting)
router.delete('/:id/docId', deleteDoctor)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
