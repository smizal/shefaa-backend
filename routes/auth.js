const express = require('express')
const app = express()
const router = express.Router()

// import controllers
const { login, signUp } = require('../controllers/auth')
const { error404 } = require('../controllers/error.js')

router.post('/login', login)
router.post('/signup', signUp)
// route.get('/users', isSignedIn, userController.userIndex)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)

module.exports = router
