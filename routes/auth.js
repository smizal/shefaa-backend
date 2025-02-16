const express = require('express')
const app = express()
const router = express.Router()

// import controllers
const { login, signUp, LoggedinUser } = require('../controllers/auth')
const { error404 } = require('../controllers/error.js')

router.post('/login', login)
router.post('/signup', signUp)
router.get('/loggedUser', LoggedinUser)
// route.get('/users', isSignedIn, userController.userIndex)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)

module.exports = router
