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
  appByDoctor,
  updateStatus
} = require('../controllers/appointments.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', isAuthorized(['admin', 'doctor', 'receptionist']), index)
router.get('/range/:start', isAuthorized(['admin', 'receptionist']), index)
router.get('/range/:start/:end', isAuthorized(['admin', 'receptionist']), index)

router.get(
  '/get_services',
  isAuthorized(['admin', 'receptionist']),
  getServices
)
router.get(
  '/get_doctors/:srvId',
  isAuthorized(['admin', 'receptionist']),
  getDoctors
)
router.get(
  '/docApp/:id',
  isAuthorized(['admin', 'doctor', 'receptionist']),
  appByDoctor
)
router.get(
  '/docApp/:id/:start',
  isAuthorized(['admin', 'doctor', 'receptionist']),
  appByDoctor
)
router.get(
  '/docApp/:id/:start/:end',
  isAuthorized(['admin', 'doctor', 'receptionist']),
  appByDoctor
)
router.get('/:id', isAuthorized(['admin', 'doctor', 'receptionist']), show)
router.post('/', isAuthorized(['admin', 'receptionist']), create)
router.put('/:id', isAuthorized(['admin', 'receptionist']), update)
router.put('/status/:id', isAuthorized(['admin', 'receptionist']), updateStatus)
router.delete('/:id', isAuthorized(['admin', 'receptionist']), deleting)

router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
