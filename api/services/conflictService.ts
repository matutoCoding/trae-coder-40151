import * as appointmentRepo from '../repositories/appointmentRepository.js'

export interface ConflictResult {
  id: number
  patient_name: string
  start_time: string
  end_time: string
  status: string
}

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

export function checkConflict(
  chairId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): ConflictResult[] {
  validateTimeRange(startTime, endTime)
  const overlapping = appointmentRepo.findOverlappingAppointments(
    chairId, date, startTime, endTime, excludeId
  )
  return overlapping.map(a => ({
    id: a.id,
    patient_name: a.patient_name,
    start_time: a.start_time,
    end_time: a.end_time,
    status: a.status,
  }))
}

export interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
}

export function getSuggestions(chairId: number, date: string, duration: number): TimeSlot[] {
  const workStart = 8 * 60
  const workEnd = 18 * 60
  const interval = 15
  const slots: TimeSlot[] = []

  const appointments = appointmentRepo.findOverlappingAppointments(
    chairId, date, '00:00', '23:59'
  )

  for (let mins = workStart; mins + duration <= workEnd; mins += interval) {
    const slotStart = mins
    const slotEnd = mins + duration

    const startStr = formatTime(slotStart)
    const endStr = formatTime(slotEnd)

    const hasConflict = appointments.some(a => {
      const aStart = parseTime(a.start_time)
      const aEnd = parseTime(a.end_time)
      return slotStart < aEnd && aStart < slotEnd
    })

    slots.push({
      start_time: startStr,
      end_time: endStr,
      available: !hasConflict,
    })
  }

  return slots
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
