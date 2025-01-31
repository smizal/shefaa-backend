const express = require('express')
const app = express()
const route = express.Router()

// import controllers
const { login, signUp } = require('../controllers/auth')

route.post('/login', login)
route.post('/signup', signUp)
// route.get('/users', isSignedIn, userController.userIndex)

module.exports = route
