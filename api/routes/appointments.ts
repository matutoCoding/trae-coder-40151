import { Router } from 'express'
import * as appointmentCtrl from '../controllers/appointmentController.js'

const router = Router()

router.get('/', appointmentCtrl.getAppointments)
router.post('/', appointmentCtrl.createAppointment)
router.patch('/:id/cancel', appointmentCtrl.cancelAppointment)
router.patch('/:id/complete', appointmentCtrl.completeAppointment)
router.post('/followup', appointmentCtrl.createFollowup)

export default router
