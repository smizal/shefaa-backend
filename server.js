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
const { verifyToken } = require('./middleware/jwtUtils')
const authRoutes = require('./routes/auth.js')
const frontRoutes = require('./routes/front.js')
const adminRoutes = require('./routes/admin.js')
const profileRoutes = require('./routes/profile.js')

// Proper Routes use
app.use('/auth', authRoutes)
app.use('/admin', verifyToken, adminRoutes)
app.use('/profile', verifyToken, profileRoutes)
app.use('/', frontRoutes)

app.listen(PORT, () => {
  console.log(`The express app is ready on http://localhost:${PORT}`)
})
