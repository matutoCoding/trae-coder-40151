import { getDb } from '../db.js'

export interface Appointment {
  id: number
  chair_id: number
  patient_id: number
  queue_id: number | null
  appointment_date: string
  start_time: string
  end_time: string
  type: 'normal' | 'vip' | 'emergency' | 'followup'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  reminder_status?: 'pending' | 'reminded' | 'no_show' | 'rescheduled'
  reminder_time?: string | null
  no_show_reason?: string | null
  reminder_result?: string | null
}

export interface AppointmentWithDetails extends Appointment {
  patient_name: string
  patient_phone: string
  patient_type: string
  chair_name: string
  chair_location: string
  previous_queue_id?: number | null
  previous_visit_date?: string | null
  previous_visit_chair?: string | null
  previous_visit_type?: string | null
}

export function createAppointment(
  chairId: number,
  patientId: number,
  date: string,
  startTime: string,
  endTime: string,
  type: string = 'normal',
  queueId?: number
): Appointment {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO appointments (chair_id, patient_id, queue_id, appointment_date, start_time, end_time, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(chairId, patientId, queueId ?? null, date, startTime, endTime, type)
  return getAppointmentById(result.lastInsertRowid as number)!
}

export function getAppointmentById(id: number): Appointment | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as Appointment | undefined
}

export function getAppointmentByIdWithDetails(id: number): AppointmentWithDetails | undefined {
  const db = getDb()
  const sql = `
    SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type,
           c.name as chair_name, c.location as chair_location,
           a.queue_id as previous_queue_id,
           prev_q.completed_at as previous_visit_date,
           prev_c.name as previous_visit_chair,
           prev_p.type as previous_visit_type
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN dental_chairs c ON a.chair_id = c.id
    LEFT JOIN queue_entries prev_q ON a.queue_id = prev_q.id
    LEFT JOIN dental_chairs prev_c ON prev_q.chair_id = prev_c.id
    LEFT JOIN patients prev_p ON prev_q.patient_id = prev_p.id
    WHERE a.id = ?
  `
  return db.prepare(sql).get(id) as AppointmentWithDetails | undefined
}

export function getAppointments(date?: string, chairId?: number): AppointmentWithDetails[] {
  const db = getDb()
  let sql = `
    SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type,
           c.name as chair_name, c.location as chair_location,
           a.queue_id as previous_queue_id,
           prev_q.completed_at as previous_visit_date,
           prev_c.name as previous_visit_chair,
           prev_p.type as previous_visit_type
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN dental_chairs c ON a.chair_id = c.id
    LEFT JOIN queue_entries prev_q ON a.queue_id = prev_q.id
    LEFT JOIN dental_chairs prev_c ON prev_q.chair_id = prev_c.id
    LEFT JOIN patients prev_p ON prev_q.patient_id = prev_p.id
    WHERE 1=1
  `
  const params: any[] = []
  if (date) {
    sql += ' AND a.appointment_date = ?'
    params.push(date)
  }
  if (chairId) {
    sql += ' AND a.chair_id = ?'
    params.push(chairId)
  }
  sql += ' ORDER BY a.appointment_date ASC, a.start_time ASC'
  return db.prepare(sql).all(...params) as AppointmentWithDetails[]
}

export function findOverlappingAppointments(
  chairId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): AppointmentWithDetails[] {
  const db = getDb()
  let sql = `
    SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type,
           c.name as chair_name, c.location as chair_location
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN dental_chairs c ON a.chair_id = c.id
    WHERE a.chair_id = ?
      AND a.appointment_date = ?
      AND a.status != 'cancelled'
      AND a.start_time < ?
      AND a.end_time > ?
  `
  const params: any[] = [chairId, date, endTime, startTime]
  if (excludeId) {
    sql += ' AND a.id != ?'
    params.push(excludeId)
  }
  return db.prepare(sql).all(...params) as AppointmentWithDetails[]
}

export function updateAppointmentStatus(id: number, status: string): Appointment | undefined {
  const db = getDb()
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id)
  return getAppointmentById(id)
}

export function deleteAppointment(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(id)
  return result.changes > 0
}

export function updateAppointmentReminder(
  id: number,
  reminderStatus: string,
  reminderTime?: string,
  reminderResult?: string,
  noShowReason?: string
): Appointment | undefined {
  const db = getDb()
  const fields: string[] = ['reminder_status = ?']
  const params: any[] = [reminderStatus]
  if (reminderTime !== undefined) {
    fields.push('reminder_time = ?')
    params.push(reminderTime)
  }
  if (reminderResult !== undefined) {
    fields.push('reminder_result = ?')
    params.push(reminderResult)
  }
  if (noShowReason !== undefined) {
    fields.push('no_show_reason = ?')
    params.push(noShowReason)
  }
  params.push(id)
  db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  return getAppointmentById(id)
}

export interface AppointmentLog {
  id: number
  appointment_id: number
  action: string
  remark: string | null
  operator: string
  created_at: string
}

export function addAppointmentLog(appointmentId: number, action: string, remark?: string, operator?: string): AppointmentLog {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO appointment_logs (appointment_id, action, remark, operator) VALUES (?, ?, ?, ?)')
  const result = stmt.run(appointmentId, action, remark ?? null, operator ?? '前台')
  return getLogById(result.lastInsertRowid as number) as AppointmentLog
}

export function getLogsByAppointmentId(appointmentId: number): AppointmentLog[] {
  const db = getDb()
  return db.prepare('SELECT * FROM appointment_logs WHERE appointment_id = ? ORDER BY created_at DESC').all(appointmentId) as AppointmentLog[]
}

function getLogById(id: number) {
  return getDb().prepare('SELECT * FROM appointment_logs WHERE id = ?').get(id)
}

export function getFollowupStats(dateFrom?: string, dateTo?: string): {
  total: number
  completed: number
  no_show: number
  rescheduled: number
  cancelled: number
  arrival_rate: number
} {
  const db = getDb()
  let sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN reminder_status = 'no_show' THEN 1 ELSE 0 END) as no_show,
      SUM(CASE WHEN reminder_status = 'rescheduled' THEN 1 ELSE 0 END) as rescheduled,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM appointments
    WHERE type = 'followup'
  `
  const params: any[] = []
  if (dateFrom) {
    sql += ' AND appointment_date >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += ' AND appointment_date <= ?'
    params.push(dateTo)
  }
  const row = db.prepare(sql).get(...params) as {
    total: number
    completed: number | null
    no_show: number | null
    rescheduled: number | null
    cancelled: number | null
  }
  const completed = row.completed ?? 0
  const noShow = row.no_show ?? 0
  const rescheduled = row.rescheduled ?? 0
  const cancelled = row.cancelled ?? 0
  const denominator = row.total - cancelled
  const arrivalRate = denominator > 0 ? Number(((completed / denominator) * 100).toFixed(1)) : 0
  return {
    total: row.total,
    completed,
    no_show: noShow,
    rescheduled,
    cancelled,
    arrival_rate: arrivalRate
  }
}
