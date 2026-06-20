import { Router } from 'express'
import * as chairCtrl from '../controllers/chairController.js'

const router = Router()

router.get('/', chairCtrl.getChairs)
router.post('/', chairCtrl.createChair)
router.put('/:id', chairCtrl.updateChair)
router.patch('/:id/status', chairCtrl.updateChairStatus)

export default router
