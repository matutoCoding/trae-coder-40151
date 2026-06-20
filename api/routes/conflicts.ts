import { Router } from 'express'
import * as conflictCtrl from '../controllers/conflictController.js'

const router = Router()

router.post('/check', conflictCtrl.checkConflict)
router.get('/suggestions', conflictCtrl.getSuggestions)

export default router
