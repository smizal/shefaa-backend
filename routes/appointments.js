const express = require('express')

const {
  index,
  show,
  create,
  update,
  deleting,
  byTypeList
} = require('../controllers/users.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/', index)
router.get('/:id', show)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', deleting)
router.get('/type/:name', byTypeList)
router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
