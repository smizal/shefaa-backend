require('dotenv').config()
const express = require('express')
const cors = require('cors')
/* const db = require('./config/db')
const { sendEmail } = require('./config/email')
const multer = require('multer')
const { storage } = require('./config/cloudinary')
const cloudinary = require('cloudinary').v2 */

const app = express()
const PORT = process.env.PORT ? process.env.PORT : 3003

// const upload = multer({ dest: 'img/' })
/* const upload = multer({ storage }) 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}) */

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// app.use(cors({ origin: 'http://localhost:5173' }))
app.use(cors())
// middlewares and routes
const authRoutes = require('./routes/auth.js')
const frontRoutes = require('./routes/front.js')
const adminRoutes = require('./routes/admin.js')
const userRoutes = require('./routes/users.js')
const doctorRoutes = require('./routes/doctors.js')
const servicesRoutes = require('./routes/services.js')
const profileRoutes = require('./routes/profile.js')
const appointmentRoutes = require('./routes/appointments.js')
const presRoutes = require('./routes/prescriptions.js')
const invRoutes = require('./routes/invoices.js')
const { verifyToken } = require('./middleware/jwtUtils')
const { isAuthorized } = require('./middleware/permission.js')

// Proper Routes use
app.use('/auth', authRoutes)
app.use('/admin', verifyToken, adminRoutes)
app.use('/profile', verifyToken, profileRoutes)
app.use('/users', verifyToken, isAuthorized(['admin']), userRoutes)
app.use('/doctors', verifyToken, isAuthorized(['admin']), doctorRoutes)
app.use('/services', verifyToken, isAuthorized(['admin']), servicesRoutes)
app.use(
  '/invoices',
  verifyToken,
  isAuthorized(['admin', 'accountant']),
  invRoutes
)
app.use(
  '/prescriptions',
  verifyToken,
  isAuthorized(['admin', 'doctor']),
  presRoutes
)
app.use('/appointments', verifyToken, appointmentRoutes)
app.use('/', frontRoutes)

app.listen(PORT, () => {
  console.log(`The express app is ready on http://localhost:${PORT}`)
})
