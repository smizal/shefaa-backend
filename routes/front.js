const express = require('express')
const {
  contactUs,
  saveAppointment,
  ticketList,
  show,
  register,
  addThread,
  companiesList,
  companyDepartments
} = require('../controllers/front.js')

const { verifyToken } = require('../middleware/jwtUtils')

const router = express.Router()

router.post('/contact-us', contactUs)
router.post('/get_appointment', saveAppointment)
router.get('/tickets-list', verifyToken, ticketList)
router.post('/register-company', register)
router.get('/companies-list', companiesList)
router.get('/departments-list/:id', companyDepartments)
router.post('/add-thread/:id', verifyToken, addThread)
router.get('/tickets-show/:id', verifyToken, show)

module.exports = router
