const express = require('express')
const { isAuthorized } = require('../middleware/permission.js')

const {
  index,
  show,
  create,
  update,
  deleting,
  getServices,
  getDoctors,
  appByDoctor
} = require('../controllers/appointments.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', isAuthorized(['admin', 'doctor', 'receptionist']), index)
router.get('/range/:start', isAuthorized(['admin', 'receptionist']), index)
router.get('/range/:start/:end', isAuthorized(['admin', 'receptionist']), index)

router.get('/get_services', getServices)
router.get('/get_doctors/:srvId', getDoctors)
router.get('/docApp/:id', appByDoctor)
router.get('/:id', show)
router.post('/', isAuthorized(['admin', 'receptionist']), create)
router.put('/:id', update)
router.delete('/:id', deleting)

router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
