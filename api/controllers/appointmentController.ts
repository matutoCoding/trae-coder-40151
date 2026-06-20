import type { Request, Response } from 'express'
import * as appointmentService from '../services/appointmentService.js'

export function getAppointments(req: Request, res: Response): void {
  try {
    const { date, chairId } = req.query
    const appointments = appointmentService.getAppointments(
      date as string | undefined,
      chairId ? parseInt(chairId as string) : undefined
    )
    res.json({ success: true, data: appointments })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function createAppointment(req: Request, res: Response): void {
  try {
    const { chairId, patientId, patientName, patientPhone, date, startTime, endTime, type } = req.body
    if (!chairId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: '椅位ID、日期、开始时间和结束时间为必填项' })
      return
    }
    if (!patientId && (!patientName || !patientPhone)) {
      res.status(400).json({ success: false, error: '患者ID或患者姓名+电话为必填项' })
      return
    }
    const appointment = appointmentService.createAppointment(
      chairId, patientId, patientName, patientPhone, date, startTime, endTime, type
    )
    res.status(201).json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(409).json({ success: false, error: error.message })
  }
}

export function cancelAppointment(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '预约ID为必填项' })
      return
    }
    const appointment = appointmentService.cancelAppointment(id)
    res.json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function completeAppointment(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '预约ID为必填项' })
      return
    }
    const appointment = appointmentService.completeAppointment(id)
    res.json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function createFollowup(req: Request, res: Response): void {
  try {
    const { previousQueueId, chairId, date, startTime, endTime } = req.body
    if (!previousQueueId || !chairId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: '就诊记录ID、椅位ID、日期、开始时间和结束时间为必填项' })
      return
    }
    const appointment = appointmentService.createFollowup(
      previousQueueId, chairId, date, startTime, endTime
    )
    res.status(201).json({ success: true, data: appointment })
  } catch (error: any) {
    res.status(409).json({ success: false, error: error.message })
  }
}
