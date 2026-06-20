import { Router } from 'express'
import * as chairCtrl from '../controllers/chairController.js'

const router = Router()

router.get('/', chairCtrl.getChairs)
router.post('/', chairCtrl.createChair)
router.patch('/:id/status', chairCtrl.updateChairStatus)

export default router
