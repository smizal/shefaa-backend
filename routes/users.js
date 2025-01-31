const express = require('express')
const {
  index,
  create,
  companyUsers,
  show,
  update,
  deleting
} = require('../controllers/usersController.js')

const router = express.Router()

router.get('/', index)
router.get('/comp/:id', companyUsers)
router.post('/', create)
router.get('/:id', show)
router.put('/edit/:id', update)
router.delete('/:id', deleting)

module.exports = router
