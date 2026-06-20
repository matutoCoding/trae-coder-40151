import { getDb } from '../db.js'

export interface Patient {
  id: number
  name: string
  phone: string
  type: 'normal' | 'vip' | 'emergency'
  created_at: string
}

export function createPatient(name: string, phone: string, type: string = 'normal'): Patient {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO patients (name, phone, type) VALUES (?, ?, ?)')
  const result = stmt.run(name, phone, type)
  return getPatientById(result.lastInsertRowid as number)!
}

export function getPatientById(id: number): Patient | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as Patient | undefined
}

export function getAllPatients(): Patient[] {
  const db = getDb()
  return db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all() as Patient[]
}

export function updatePatient(id: number, data: Partial<Pick<Patient, 'name' | 'phone' | 'type'>>): Patient | undefined {
  const db = getDb()
  const fields: string[] = []
  const values: any[] = []
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone) }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type) }
  if (fields.length === 0) return getPatientById(id)
  values.push(id)
  db.prepare(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return getPatientById(id)
}

export function deletePatient(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM patients WHERE id = ?').run(id)
  return result.changes > 0
}

export function findPatientByPhone(phone: string): Patient | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM patients WHERE phone = ?').get(phone) as Patient | undefined
}
