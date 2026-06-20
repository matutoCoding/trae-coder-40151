import { Router } from 'express'
import * as queueCtrl from '../controllers/queueController.js'

const router = Router()

router.post('/take', queueCtrl.takeNumber)
router.get('/', queueCtrl.getQueue)
router.get('/priority', queueCtrl.getPriorityQueue)
router.get('/serving', queueCtrl.getServing)
router.post('/call-next', queueCtrl.callNext)
router.post('/:id/call', queueCtrl.callSpecific)
router.post('/:id/complete', queueCtrl.completeService)
router.post('/:id/cancel', queueCtrl.cancelEntry)
router.post('/:id/promote', queueCtrl.promotePriority)
router.put('/:id/position', queueCtrl.reposition)

export default router
