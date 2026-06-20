import { getDb } from '../db.js'

export interface DentalChair {
  id: number
  name: string
  status: 'available' | 'occupied' | 'maintenance'
  location: string
  created_at: string
}

export function createChair(name: string, location: string = ''): DentalChair {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO dental_chairs (name, location) VALUES (?, ?)')
  const result = stmt.run(name, location)
  return getChairById(result.lastInsertRowid as number)!
}

export function getChairById(id: number): DentalChair | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM dental_chairs WHERE id = ?').get(id) as DentalChair | undefined
}

export function getAllChairs(): DentalChair[] {
  const db = getDb()
  return db.prepare('SELECT * FROM dental_chairs ORDER BY id ASC').all() as DentalChair[]
}

export function updateChairStatus(id: number, status: string): DentalChair | undefined {
  const db = getDb()
  db.prepare('UPDATE dental_chairs SET status = ? WHERE id = ?').run(status, id)
  return getChairById(id)
}

export function updateChair(id: number, name: string, location: string): DentalChair | undefined {
  const db = getDb()
  db.prepare('UPDATE dental_chairs SET name = ?, location = ? WHERE id = ?').run(name, location, id)
  return getChairById(id)
}

export function getAvailableChairs(): DentalChair[] {
  const db = getDb()
  return db.prepare("SELECT * FROM dental_chairs WHERE status = 'available' ORDER BY id ASC").all() as DentalChair[]
}

export function getChairsByStatus(statuses: string[]): DentalChair[] {
  const db = getDb()
  const placeholders = statuses.map(() => '?').join(', ')
  const sql = `SELECT * FROM dental_chairs WHERE status IN (${placeholders}) ORDER BY id ASC`
  return db.prepare(sql).all(...statuses) as DentalChair[]
}

export function deleteChair(id: number): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM dental_chairs WHERE id = ?').run(id)
  return result.changes > 0
}
