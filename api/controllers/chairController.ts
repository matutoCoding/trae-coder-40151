import type { Request, Response } from 'express'
import * as chairService from '../services/chairService.js'

export function getChairs(req: Request, res: Response): void {
  try {
    const status = req.query.status as string | undefined
    const chairs = chairService.getChairs(status)
    res.json({ success: true, data: chairs })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function createChair(req: Request, res: Response): void {
  try {
    const { name, location } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '椅位名称为必填项' })
      return
    }
    const chair = chairService.createChair(name, location)
    res.status(201).json({ success: true, data: chair })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function updateChairStatus(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body
    if (!id || !status) {
      res.status(400).json({ success: false, error: '椅位ID和状态为必填项' })
      return
    }
    const chair = chairService.updateChairStatus(id, status)
    res.json({ success: true, data: chair })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function updateChair(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { name, location } = req.body
    if (!id || !name) {
      res.status(400).json({ success: false, error: '椅位ID和名称为必填项' })
      return
    }
    const chair = chairService.updateChair(id, name, location || '')
    res.json({ success: true, data: chair })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}
