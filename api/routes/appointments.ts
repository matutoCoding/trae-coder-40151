import { Router } from 'express'
import * as appointmentCtrl from '../controllers/appointmentController.js'

const router = Router()

router.get('/', appointmentCtrl.getAppointments)
router.get('/stats/followup', appointmentCtrl.getFollowupStats)
router.get('/:id', appointmentCtrl.getAppointmentById)
router.get('/:id/logs', appointmentCtrl.getAppointmentLogs)
router.post('/', appointmentCtrl.createAppointment)
router.patch('/:id/cancel', appointmentCtrl.cancelAppointment)
router.patch('/:id/complete', appointmentCtrl.completeAppointment)
router.patch('/:id/reminded', appointmentCtrl.markReminded)
router.patch('/:id/no-show', appointmentCtrl.markNoShow)
router.patch('/:id/rescheduled', appointmentCtrl.markRescheduled)
router.post('/followup', appointmentCtrl.createFollowup)

export default router
