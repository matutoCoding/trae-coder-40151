import type { Request, Response } from 'express'
import * as appointmentService from '../services/appointmentService.js'
import * as chairRepo from '../repositories/chairRepository.js'

export function getAppointments(req: Request, res: Response): void {
  try {
    const { date, chairId, type } = req.query
    let appointments = appointmentService.getAppointments(
      date as string | undefined,
      chairId ? parseInt(chairId as string) : undefined
    )
    if (type) {
      appointments = appointments.filter(a => a.type === type)
    }
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
    const chair = chairRepo.getChairById(chairId)
    if (!chair) {
      res.status(400).json({ success: false, error: '椅位不存在' })
      return
    }
    if (chair.status === 'maintenance') {
      res.status(400).json({ success: false, error: '该牙椅正在维护中，无法预约' })
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

export function getAppointmentById(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '预约ID为必填项' })
      return
    }
    const appointment = appointmentService.getAppointmentById(id)
    res.json({ success: true, data: appointment })
  } catch (error: any) {
    if (error.message === '预约不存在') {
      res.status(404).json({ success: false, error: error.message })
    } else {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}

export function createFollowup(req: Request, res: Response): void {
  try {
    const { previousQueueId, chairId, date, startTime, endTime } = req.body
    if (!previousQueueId || !chairId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: '就诊记录ID、椅位ID、日期、开始时间和结束时间为必填项' })
      return
    }
    const chair = chairRepo.getChairById(chairId)
    if (!chair) {
      res.status(400).json({ success: false, error: '椅位不存在' })
      return
    }
    if (chair.status === 'maintenance') {
      res.status(400).json({ success: false, error: '该牙椅正在维护中，无法预约复诊' })
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

export function markReminded(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { result } = req.body
    if (!id) {
      res.status(400).json({ success: false, error: '预约ID为必填项' })
      return
    }
    appointmentService.markReminded(id, result)
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function markNoShow(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { reason } = req.body
    if (!id) {
      res.status(400).json({ success: false, error: '预约ID为必填项' })
      return
    }
    appointmentService.markNoShow(id, reason)
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export function markRescheduled(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    const { result } = req.body
    if (!id) {
      res.status(400).json({ success: false, error: '预约ID为必填项' })
      return
    }
    appointmentService.markRescheduled(id, result)
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
}
