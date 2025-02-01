const express = require('express')
const { index } = require('../controllers/admin.js')

const router = express.Router()

router.get('/', index)

module.exports = router
