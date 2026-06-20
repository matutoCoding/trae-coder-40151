import * as appointmentRepo from '../repositories/appointmentRepository.js'
import * as patientRepo from '../repositories/patientRepository.js'
import * as queueRepo from '../repositories/queueRepository.js'
import * as conflictService from './conflictService.js'

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function validateTimeRange(startTime: string, endTime: string) {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const workStart = 8 * 60
  const workEnd = 18 * 60

  if (start < workStart || start >= workEnd) {
    throw new Error('预约时间必须在工作时间内（08:00-18:00）')
  }
  if (end <= workStart || end > workEnd) {
    throw new Error('预约结束时间必须在工作时间内（08:00-18:00）')
  }
  if (end <= start) {
    throw new Error('结束时间必须晚于开始时间')
  }
  const duration = end - start
  if (duration < 15) {
    throw new Error('预约时长至少为15分钟')
  }
  if (duration > 240) {
    throw new Error('预约时长不能超过240分钟（4小时）')
  }
}

export function createAppointment(
  chairId: number,
  patientId: number | undefined,
  patientName: string | undefined,
  patientPhone: string | undefined,
  date: string,
  startTime: string,
  endTime: string,
  type: string = 'normal'
) {
  validateTimeRange(startTime, endTime)

  let resolvedPatientId = patientId
  if (!resolvedPatientId) {
    const existing = patientName && patientPhone ? patientRepo.findPatientByPhone(patientPhone) : undefined
    if (existing) {
      resolvedPatientId = existing.id
    } else if (patientName && patientPhone) {
      const patient = patientRepo.createPatient(patientName, patientPhone, type === 'followup' ? 'normal' : type)
      resolvedPatientId = patient.id
    } else {
      throw new Error('患者信息不足')
    }
  }

  const conflicts = conflictService.checkConflict(chairId, date, startTime, endTime)
  if (conflicts.length > 0) {
    const details = conflicts.map(c =>
      `${c.patient_name} ${c.start_time}-${c.end_time}`
    ).join(', ')
    throw new Error(`时间冲突: ${details}`)
  }

  return appointmentRepo.createAppointment(chairId, resolvedPatientId!, date, startTime, endTime, type)
}

export function getAppointments(date?: string, chairId?: number) {
  return appointmentRepo.getAppointments(date, chairId)
}

export function getAppointmentById(id: number) {
  const appointment = appointmentRepo.getAppointmentByIdWithDetails(id)
  if (!appointment) throw new Error('预约不存在')
  return appointment
}

export function cancelAppointment(id: number) {
  const appointment = appointmentRepo.getAppointmentById(id)
  if (!appointment) throw new Error('预约不存在')
  if (appointment.status === 'cancelled') throw new Error('预约已取消')
  if (appointment.status === 'completed') throw new Error('预约已完成，无法取消')
  return appointmentRepo.updateAppointmentStatus(id, 'cancelled')
}

export function completeAppointment(id: number) {
  const appointment = appointmentRepo.getAppointmentById(id)
  if (!appointment) throw new Error('预约不存在')
  if (appointment.status !== 'scheduled' && appointment.status !== 'in_progress') {
    throw new Error('预约状态无法完成')
  }
  return appointmentRepo.updateAppointmentStatus(id, 'completed')
}

export function createFollowup(
  previousQueueId: number,
  chairId: number,
  date: string,
  startTime: string,
  endTime: string
) {
  validateTimeRange(startTime, endTime)

  const queueEntry = queueRepo.getQueueEntryById(previousQueueId)
  if (!queueEntry) throw new Error('就诊记录不存在')
  if (queueEntry.status !== 'completed') throw new Error('只能为已完成的就诊创建复诊预约')

  const patient = patientRepo.getPatientById(queueEntry.patient_id)
  if (!patient) throw new Error('患者不存在')

  const conflicts = conflictService.checkConflict(chairId, date, startTime, endTime)
  if (conflicts.length > 0) {
    const details = conflicts.map(c =>
      `${c.patient_name} ${c.start_time}-${c.end_time}`
    ).join(', ')
    throw new Error(`时间冲突: ${details}`)
  }

  return appointmentRepo.createAppointment(
    chairId,
    patient.id,
    date,
    startTime,
    endTime,
    'followup',
    previousQueueId
  )
}

export function markReminded(id: number, result?: string) {
  const appointment = appointmentRepo.getAppointmentById(id)
  if (!appointment) throw new Error('预约不存在')
  const now = new Date().toISOString()
  return appointmentRepo.updateAppointmentReminder(id, 'reminded', now, result)
}

export function markNoShow(id: number, reason?: string) {
  const appointment = appointmentRepo.getAppointmentById(id)
  if (!appointment) throw new Error('预约不存在')
  return appointmentRepo.updateAppointmentReminder(id, 'no_show', undefined, undefined, reason)
}

export function markRescheduled(id: number, result?: string) {
  const appointment = appointmentRepo.getAppointmentById(id)
  if (!appointment) throw new Error('预约不存在')
  return appointmentRepo.updateAppointmentReminder(id, 'rescheduled', undefined, result)
}
