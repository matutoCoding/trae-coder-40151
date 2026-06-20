import * as patientRepo from '../repositories/patientRepository.js'
import * as queueRepo from '../repositories/queueRepository.js'
import * as chairRepo from '../repositories/chairRepository.js'
import { getDb } from '../db.js'

const PRIORITY_MAP: Record<string, number> = {
  normal: 0,
  vip: 10,
  emergency: 20,
}

function generateQueueNumber(): string {
  const lastNumber = queueRepo.getTodayMaxQueueNumber()
  let nextSeq = 1
  if (lastNumber) {
    const seqPart = lastNumber.slice(1)
    nextSeq = parseInt(seqPart, 10) + 1
  }
  return 'A' + String(nextSeq).padStart(3, '0')
}

export function takeNumber(patientName: string, phone: string, type: string = 'normal') {
  const db = getDb()
  const priority = PRIORITY_MAP[type] ?? 0

  const result = db.transaction(() => {
    const patient = patientRepo.createPatient(patientName, phone, type)
    const queueNumber = generateQueueNumber()
    const entry = queueRepo.createQueueEntry(patient.id, queueNumber, priority)
    const position = queueRepo.getWaitingPosition(entry.id)
    return {
      id: entry.id,
      queueNumber: entry.queue_number,
      position,
      estimatedWaitMinutes: position * 15,
      patient,
    }
  })()

  return result
}

export function getQueue() {
  return queueRepo.getWaitingQueue()
}

export function getServing() {
  return queueRepo.getServingEntries()
}

export function callNext(chairId: number) {
  const db = getDb()

  const chair = chairRepo.getChairById(chairId)
  if (!chair) throw new Error('椅位不存在')
  if (chair.status === 'maintenance') throw new Error('椅位正在维护中')
  if (chair.status === 'occupied') throw new Error('椅位正在使用中')

  const waitingQueue = queueRepo.getWaitingQueue()
  if (waitingQueue.length === 0) throw new Error('暂无等待的患者')

  const nextPatient = waitingQueue[0]

  const result = db.transaction(() => {
    const entry = queueRepo.updateQueueStatus(nextPatient.id, 'serving', chairId)
    chairRepo.updateChairStatus(chairId, 'occupied')
    return { entry, chair }
  })()

  return {
    ...nextPatient,
    status: 'serving',
    chair_id: chairId,
  }
}

export function callSpecific(id: number, chairId: number) {
  const db = getDb()

  const entry = queueRepo.getQueueEntryById(id)
  if (!entry) throw new Error('排队记录不存在')
  if (entry.status !== 'waiting') throw new Error('该患者不在等待状态')

  const chair = chairRepo.getChairById(chairId)
  if (!chair) throw new Error('椅位不存在')
  if (chair.status === 'maintenance') throw new Error('椅位正在维护中')
  if (chair.status === 'occupied') throw new Error('椅位正在使用中')

  db.transaction(() => {
    queueRepo.updateQueueStatus(id, 'serving', chairId)
    chairRepo.updateChairStatus(chairId, 'occupied')
  })()

  const patient = patientRepo.getPatientById(entry.patient_id)
  return {
    ...entry,
    status: 'serving',
    chair_id: chairId,
    patient_name: patient?.name,
    patient_phone: patient?.phone,
    patient_type: patient?.type,
  }
}

export function completeService(id: number) {
  const db = getDb()

  const entry = queueRepo.getQueueEntryById(id)
  if (!entry) throw new Error('排队记录不存在')
  if (entry.status !== 'serving') throw new Error('该患者不在就诊状态')

  db.transaction(() => {
    queueRepo.updateQueueStatus(id, 'completed')
    if (entry.chair_id) {
      chairRepo.updateChairStatus(entry.chair_id, 'available')
    }
  })()

  return queueRepo.getQueueEntryById(id)
}

export function cancelEntry(id: number) {
  const entry = queueRepo.getQueueEntryById(id)
  if (!entry) throw new Error('排队记录不存在')
  if (entry.status === 'completed' || entry.status === 'cancelled') {
    throw new Error('无法取消已完成或已取消的记录')
  }

  const db = getDb()
  db.transaction(() => {
    queueRepo.updateQueueStatus(id, 'cancelled')
    if (entry.status === 'serving' && entry.chair_id) {
      chairRepo.updateChairStatus(entry.chair_id, 'available')
    }
  })()

  return queueRepo.getQueueEntryById(id)
}

export function promotePriority(id: number, type: string, targetPosition?: number) {
  const entry = queueRepo.getQueueEntryById(id)
  if (!entry) throw new Error('排队记录不存在')
  if (entry.status !== 'waiting') throw new Error('只能提升等待中的患者优先级')

  const newPriority = PRIORITY_MAP[type] ?? entry.priority

  if (targetPosition !== undefined) {
    const waitingQueue = queueRepo.getWaitingQueue()
    if (targetPosition < 1 || targetPosition > waitingQueue.length) {
      throw new Error('目标位置无效')
    }
    const targetEntry = waitingQueue[targetPosition - 1]
    queueRepo.updateQueuePriority(id, targetEntry.priority + 1)
  } else {
    queueRepo.updateQueuePriority(id, newPriority)
  }

  return queueRepo.getQueueEntryById(id)
}

export function reposition(id: number, newPosition: number) {
  const entry = queueRepo.getQueueEntryById(id)
  if (!entry) throw new Error('排队记录不存在')
  if (entry.status !== 'waiting') throw new Error('只能调整等待中的患者位置')

  const waitingQueue = queueRepo.getWaitingQueue()
  if (newPosition < 1 || newPosition > waitingQueue.length) {
    throw new Error('目标位置无效')
  }

  const targetEntry = waitingQueue[newPosition - 1]
  queueRepo.updateQueuePriority(id, targetEntry.priority)

  return queueRepo.getQueueEntryById(id)
}
