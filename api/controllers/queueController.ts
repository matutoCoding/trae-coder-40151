import type { Request, Response } from 'express'
import * as queueService from '../services/queueService.js'

export function takeNumber(req: Request, res: Response): void {
  try {
    const { patientName, phone, type } = req.body
    if (!patientName || !phone) {
      res.status(400).json({ success: false, error: '患者姓名和电话为必填项' })
      return
    }
    const result = queueService.takeNumber(patientName, phone, type)
    res.status(201).json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function getQueue(req: Request, res: Response): void {
  try {
    const queue = queueService.getQueue()
    res.json({ success: true, data: queue })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function getPriorityQueue(req: Request, res: Response): void {
  try {
    const queue = queueService.getQueue()
    res.json({ success: true, data: queue })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function getServing(req: Request, res: Response): void {
  try {
    const serving = queueService.getServing()
    res.json({ success: true, data: serving })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function callNext(req: Request, res: Response): void {
  try {
    const { chairId } = req.body
    if (!chairId) {
      res.status(400).json({ success: false, error: '椅位ID为必填项' })
      return
    }
    const result = queueService.callNext(chairId)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function callSpecific(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { chairId } = req.body
    if (!id || !chairId) {
      res.status(400).json({ success: false, error: '排队ID和椅位ID为必填项' })
      return
    }
    const result = queueService.callSpecific(id, chairId)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function completeService(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '排队ID为必填项' })
      return
    }
    const result = queueService.completeService(id)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function cancelEntry(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '排队ID为必填项' })
      return
    }
    const result = queueService.cancelEntry(id)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function promotePriority(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { type, targetPosition } = req.body
    if (!id) {
      res.status(400).json({ success: false, error: '排队ID为必填项' })
      return
    }
    const result = queueService.promotePriority(id, type, targetPosition)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function reposition(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { newPosition } = req.body
    if (!id || newPosition === undefined) {
      res.status(400).json({ success: false, error: '排队ID和目标位置为必填项' })
      return
    }
    const result = queueService.reposition(id, newPosition)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}
