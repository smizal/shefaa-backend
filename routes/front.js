const express = require('express')
const {
  contactUs,
  saveAppointment,
  dashboard,
  show,
  medicines,
  showInvoice
} = require('../controllers/front.js')

const { verifyToken } = require('../middleware/jwtUtils')

const router = express.Router()

router.post('/contact-us', contactUs)
router.post('/get_appointment', saveAppointment)
router.get('/patient', verifyToken, dashboard)
router.get('/patient/:id', verifyToken, show)
router.get('/patient/medicine/:id', verifyToken, medicines)
router.get('/patient/report/:id', verifyToken, show)
router.get('/patient/invoice/:id', verifyToken, showInvoice)

module.exports = router
