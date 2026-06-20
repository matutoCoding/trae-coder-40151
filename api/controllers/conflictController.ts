import type { Request, Response } from 'express'
import * as conflictService from '../services/conflictService.js'
import * as chairRepo from '../repositories/chairRepository.js'

export function checkConflict(req: Request, res: Response): void {
  try {
    const { chairId, date, startTime, endTime, excludeId } = req.body
    if (!chairId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: '椅位ID、日期、开始时间和结束时间为必填项' })
      return
    }
    const conflicts = conflictService.checkConflict(chairId, date, startTime, endTime, excludeId)
    const chair = chairRepo.getChairById(chairId)
    const chairName = chair?.name || ''
    const suggestions = conflicts.length > 0
      ? conflictService.getSuggestions(chairId, date, parseDuration(startTime, endTime))
      : []
    res.json({
      success: true,
      data: {
        hasConflict: conflicts.length > 0,
        conflicts: conflicts.map(c => ({
          appointmentId: c.id,
          patientName: c.patient_name,
          startTime: c.start_time,
          endTime: c.end_time,
        })),
        suggestions: suggestions.filter(s => s.available).slice(0, 5).map(s => ({
          startTime: s.start_time,
          endTime: s.end_time,
          chairId,
          chairName,
        })),
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

function parseDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export function getSuggestions(req: Request, res: Response): void {
  try {
    const { chairId, date, duration } = req.query
    if (!chairId || !date || !duration) {
      res.status(400).json({ success: false, error: '椅位ID、日期和时长为必填项' })
      return
    }
    const cid = parseInt(chairId as string)
    const slots = conflictService.getSuggestions(cid, date as string, parseInt(duration as string))
    const chair = chairRepo.getChairById(cid)
    const chairName = chair?.name || ''
    res.json({
      success: true,
      data: slots.filter(s => s.available).slice(0, 10).map(s => ({
        startTime: s.start_time,
        endTime: s.end_time,
        chairId: cid,
        chairName,
      })),
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
