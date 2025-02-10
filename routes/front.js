const express = require('express')
const {
  contactUs,
  saveAppointment,
  dashboard,
  show,
  medicines,
  showInvoice,
  getServices,
  getDoctors
} = require('../controllers/front.js')

const { error404 } = require('../controllers/error.js')

const { verifyToken } = require('../middleware/jwtUtils')

const router = express.Router()

router.post('/contact-us', contactUs)
router.post('/get_appointment', saveAppointment)
router.get('/get_services', getServices)
router.get('/get_doctors/:srvId', getDoctors)
router.get('/get_doctors', getDoctors)
router.get('/patient', verifyToken, dashboard)
router.get('/patient/:id', verifyToken, show)
router.get('/patient/medicine/:id', verifyToken, medicines)
router.get('/patient/report/:id', verifyToken, show)
router.get('/patient/invoice/:id', verifyToken, showInvoice)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
