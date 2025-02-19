const express = require('express')
const { isAuthorized } = require('../middleware/permission.js')

const {
  index,
  show,
  create,
  update,
  deleting,
  getServices,
  getDoctors,
  appByDoctor,
  getIcd,
  getLabs,
  addLabTest,
  getMeds,
  addMed
} = require('../controllers/prescriptions.js')
const { error404 } = require('../controllers/error.js')

const router = express.Router()

router.get('/icd', getIcd)
router.get('/labs', getLabs)
router.get('/meds', getMeds)
router.get('/:id', show)
router.post('/addTest/:id', addLabTest)
router.post('/addMed/:id', addMed)
router.post('/:id', create)
router.put('/:id', update)
router.delete('/:id', isAuthorized(['admin']), deleting)

router.get('*', error404)
router.post('*', error404)
router.put('*', error404)
router.delete('*', error404)
module.exports = router
