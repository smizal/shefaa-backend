const express = require('express')
const { isAuthorized } = require('../middleware/permission.js')

const { index, show, updateStatus } = require('../controllers/invoices.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.put('/:id', updateStatus)

router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
