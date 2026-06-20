import * as appointmentRepo from '../repositories/appointmentRepository.js'
import * as patientRepo from '../repositories/patientRepository.js'
import * as queueRepo from '../repositories/queueRepository.js'
import * as conflictService from './conflictService.js'

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
