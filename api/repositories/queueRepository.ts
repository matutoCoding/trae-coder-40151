import { getDb } from '../db.js'

export interface QueueEntry {
  id: number
  patient_id: number
  queue_number: string
  priority: number
  status: 'waiting' | 'serving' | 'completed' | 'cancelled'
  chair_id: number | null
  created_at: string
  called_at: string | null
  completed_at: string | null
}

export interface QueueEntryWithPatient extends QueueEntry {
  patient_name: string
  patient_phone: string
  patient_type: string
}

export interface QueueEntryWithDetails extends QueueEntryWithPatient {
  chair_name: string | null
  chair_location: string | null
}

export function createQueueEntry(patientId: number, queueNumber: string, priority: number): QueueEntry {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO queue_entries (patient_id, queue_number, priority) VALUES (?, ?, ?)')
  const result = stmt.run(patientId, queueNumber, priority)
  return getQueueEntryById(result.lastInsertRowid as number)!
}

export function getQueueEntryById(id: number): QueueEntry | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id) as QueueEntry | undefined
}

export function getWaitingQueue(): QueueEntryWithPatient[] {
  const db = getDb()
  return db.prepare(`
    SELECT q.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type
    FROM queue_entries q
    JOIN patients p ON q.patient_id = p.id
    WHERE q.status = 'waiting'
    ORDER BY q.priority DESC, q.created_at ASC
  `).all() as QueueEntryWithPatient[]
}

export function getServingEntries(): QueueEntryWithDetails[] {
  const db = getDb()
  return db.prepare(`
    SELECT q.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type,
           c.name as chair_name, c.location as chair_location
    FROM queue_entries q
    JOIN patients p ON q.patient_id = p.id
    LEFT JOIN dental_chairs c ON q.chair_id = c.id
    WHERE q.status = 'serving'
    ORDER BY q.called_at ASC
  `).all() as QueueEntryWithDetails[]
}

export function updateQueueStatus(id: number, status: string, chairId?: number | null): QueueEntry | undefined {
  const db = getDb()
  if (status === 'serving') {
    db.prepare('UPDATE queue_entries SET status = ?, chair_id = ?, called_at = datetime(\'now\') WHERE id = ?')
      .run(status, chairId ?? null, id)
  } else if (status === 'completed') {
    db.prepare('UPDATE queue_entries SET status = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run(status, id)
  } else {
    db.prepare('UPDATE queue_entries SET status = ? WHERE id = ?').run(status, id)
  }
  return getQueueEntryById(id)
}

export function updateQueuePriority(id: number, priority: number): QueueEntry | undefined {
  const db = getDb()
  db.prepare('UPDATE queue_entries SET priority = ? WHERE id = ?').run(priority, id)
  return getQueueEntryById(id)
}

export function getTodayMaxQueueNumber(): string | null {
  const db = getDb()
  const row = db.prepare(`
    SELECT queue_number FROM queue_entries
    WHERE date(created_at) = date('now')
    ORDER BY id DESC LIMIT 1
  `).get() as { queue_number: string } | undefined
  return row?.queue_number ?? null
}

export function getWaitingPosition(id: number): number {
  const db = getDb()
  const entries = db.prepare(`
    SELECT id FROM queue_entries
    WHERE status = 'waiting'
    ORDER BY priority DESC, created_at ASC
  `).all() as { id: number }[]
  const idx = entries.findIndex(e => e.id === id)
  return idx >= 0 ? idx + 1 : -1
}

export function getAllQueueEntries(): QueueEntryWithPatient[] {
  const db = getDb()
  return db.prepare(`
    SELECT q.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type
    FROM queue_entries q
    JOIN patients p ON q.patient_id = p.id
    ORDER BY q.priority DESC, q.created_at ASC
  `).all() as QueueEntryWithPatient[]
}

export function getCompletedByPatient(patientId: number): QueueEntry | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM queue_entries
    WHERE patient_id = ? AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 1
  `).get(patientId) as QueueEntry | undefined
}

export function getQueueEntryByIdWithDetails(id: number): QueueEntryWithDetails | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT q.*, p.name as patient_name, p.phone as patient_phone, p.type as patient_type,
           c.name as chair_name, c.location as chair_location
    FROM queue_entries q
    JOIN patients p ON q.patient_id = p.id
    LEFT JOIN dental_chairs c ON q.chair_id = c.id
    WHERE q.id = ?
  `).get(id) as QueueEntryWithDetails | undefined
}
