import { Router } from 'express'
import * as patientCtrl from '../controllers/patientController.js'

const router = Router()

router.get('/', patientCtrl.getPatients)
router.get('/find', patientCtrl.findPatientByPhone)
router.get('/:id', patientCtrl.getPatientById)
router.get('/:id/history', patientCtrl.getPatientHistory)

export default router
