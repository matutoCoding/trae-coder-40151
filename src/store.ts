import { create } from 'zustand'

interface Patient {
  id: number
  name: string
  phone: string
  type: 'normal' | 'vip' | 'emergency'
}

interface QueueEntry {
  id: number
  patientName: string
  patientPhone: string
  type: 'normal' | 'vip' | 'emergency'
  priority: number
  status: 'waiting' | 'serving' | 'completed' | 'cancelled'
  chairId: number | null
  chairName?: string
  queueNumber: string
  createdAt: string
  calledAt: string | null
  completedAt: string | null
  waitMinutes?: number
  serveMinutes?: number
}

interface DentalChair {
  id: number
  name: string
  status: 'available' | 'occupied' | 'maintenance'
  location: string
  currentPatient?: string
  startTime?: string
}

interface Appointment {
  id: number
  chairId: number
  chairName?: string
  patientName: string
  patientPhone: string
  appointmentDate: string
  startTime: string
  endTime: string
  type: 'normal' | 'vip' | 'emergency' | 'followup'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  reminderStatus: 'pending' | 'reminded' | 'no_show' | 'rescheduled'
  reminderTime?: string | null
  noShowReason?: string | null
  reminderResult?: string | null
  queueId: number | null
  createdAt: string
  previousQueueId?: number | null
  previousVisitDate?: string | null
  previousVisitChair?: string | null
  previousVisitType?: string | null
}

interface ConflictDetail {
  appointmentId: number
  patientName: string
  startTime: string
  endTime: string
}

interface TimeSlot {
  startTime: string
  endTime: string
  chairId: number
  chairName: string
}

interface AppointmentLog {
  id: number
  appointmentId: number
  action: string
  remark: string | null
  operator: string
  createdAt: string
}

interface AppState {
  queue: QueueEntry[]
  priorityQueue: QueueEntry[]
  servingList: QueueEntry[]
  chairs: DentalChair[]
  appointments: Appointment[]
  followups: Appointment[]
  patients: Patient[]
  loading: boolean
  error: string | null

  fetchQueue: () => Promise<void>
  fetchPriorityQueue: () => Promise<void>
  fetchServingList: () => Promise<void>
  takeNumber: (name: string, phone: string, type: string) => Promise<{ queueNumber: string; position: number; estimatedWait: number }>
  callNext: (chairId: number) => Promise<void>
  callSpecific: (id: number, chairId: number) => Promise<void>
  completeService: (id: number) => Promise<QueueEntry | null>
  cancelEntry: (id: number) => Promise<void>
  promoteEntry: (id: number, type: string, targetPosition?: number) => Promise<void>
  repositionEntry: (id: number, newPosition: number) => Promise<void>

  fetchPatients: () => Promise<void>
  fetchChairs: () => Promise<void>
  createChair: (name: string, location: string) => Promise<void>
  updateChair: (id: number, name: string, location: string) => Promise<void>
  updateChairStatus: (id: number, status: string) => Promise<void>

  fetchAppointments: (date?: string, chairId?: number, fetchAll?: boolean) => Promise<void>
  fetchFollowups: () => Promise<void>
  createAppointment: (chairId: number, patientName: string, patientPhone: string, date: string, startTime: string, endTime: string, type: string) => Promise<void>
  cancelAppointment: (id: number) => Promise<void>
  completeAppointment: (id: number) => Promise<void>
  createFollowup: (queueId: number, chairId: number, date: string, startTime: string, endTime: string) => Promise<void>
  markReminded: (id: number, result?: string) => Promise<void>
  markNoShow: (id: number, reason?: string) => Promise<void>
  markRescheduled: (id: number, result?: string) => Promise<void>

  checkConflict: (chairId: number, date: string, startTime: string, endTime: string, excludeId?: number) => Promise<{ hasConflict: boolean; conflicts: ConflictDetail[]; suggestions: TimeSlot[] }>
  getSuggestions: (chairId: number, date: string, duration: number) => Promise<TimeSlot[]>
  getAppointmentById: (id: number) => Promise<Appointment | null>
  fetchAppointmentLogs: (id: number) => Promise<AppointmentLog[]>

  clearError: () => void
}

export type {
  Patient,
  QueueEntry,
  DentalChair,
  Appointment,
  AppointmentLog,
  ConflictDetail,
  TimeSlot,
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

function mapQueueEntry(raw: any): QueueEntry {
  return {
    id: raw.id,
    patientName: raw.patient_name || raw.patientName,
    patientPhone: raw.patient_phone || raw.patientPhone,
    type: raw.patient_type || raw.type,
    priority: raw.priority,
    status: raw.status,
    chairId: raw.chair_id ?? raw.chairId,
    chairName: raw.chair_name || raw.chairName,
    queueNumber: raw.queue_number || raw.queueNumber,
    createdAt: raw.created_at || raw.createdAt,
    calledAt: raw.called_at || raw.calledAt,
    completedAt: raw.completed_at || raw.completedAt,
  }
}

function mapChair(raw: any): DentalChair {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    location: raw.location,
  }
}

function mapAppointment(raw: any): Appointment {
  return {
    id: raw.id,
    chairId: raw.chair_id ?? raw.chairId,
    chairName: raw.chair_name || raw.chairName,
    patientName: raw.patient_name || raw.patientName,
    patientPhone: raw.patient_phone || raw.patientPhone,
    appointmentDate: raw.appointment_date || raw.appointmentDate,
    startTime: raw.start_time || raw.startTime,
    endTime: raw.end_time || raw.endTime,
    type: raw.type,
    status: raw.status,
    reminderStatus: raw.reminder_status || raw.reminderStatus || 'pending',
    reminderTime: raw.reminder_time ?? raw.reminderTime,
    noShowReason: raw.no_show_reason ?? raw.noShowReason,
    reminderResult: raw.reminder_result ?? raw.reminderResult,
    queueId: raw.queue_id ?? raw.queueId,
    createdAt: raw.created_at || raw.createdAt,
    previousQueueId: raw.previous_queue_id ?? raw.previousQueueId,
    previousVisitDate: raw.previous_visit_date ?? raw.previousVisitDate,
    previousVisitChair: raw.previous_visit_chair ?? raw.previousVisitChair,
    previousVisitType: raw.previous_visit_type ?? raw.previousVisitType,
  }
}

function mapPatient(raw: any): Patient {
  return {
    id: raw.id,
    name: raw.name || raw.patient_name || raw.patientName,
    phone: raw.phone || raw.patient_phone || raw.patientPhone,
    type: raw.type || raw.patient_type || 'normal',
  }
}

function mapAppointmentLog(raw: any): AppointmentLog {
  return {
    id: raw.id,
    appointmentId: raw.appointment_id ?? raw.appointmentId,
    action: raw.action,
    remark: raw.remark ?? null,
    operator: raw.operator || '前台',
    createdAt: raw.created_at || raw.createdAt,
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  queue: [],
  priorityQueue: [],
  servingList: [],
  chairs: [],
  appointments: [],
  followups: [],
  patients: [],
  loading: false,
  error: null,

  fetchQueue: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: any[] }>('/api/queue')
      set({ queue: data.data.map(mapQueueEntry), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchPriorityQueue: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: any[] }>('/api/queue/priority')
      set({ priorityQueue: data.data.map(mapQueueEntry), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchServingList: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: any[] }>('/api/queue/serving')
      set({ servingList: data.data.map(mapQueueEntry), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  takeNumber: async (name, phone, type) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: { queueNumber: string; position: number; estimatedWait: number } }>('/api/queue/take', {
        method: 'POST',
        body: JSON.stringify({ patientName: name, phone, type }),
      })
      await get().fetchQueue()
      return data.data
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  callNext: async (chairId) => {
    set({ loading: true, error: null })
    try {
      await apiFetch('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ chairId }),
      })
      await Promise.all([get().fetchQueue(), get().fetchServingList(), get().fetchChairs()])
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  callSpecific: async (id, chairId) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/queue/${id}/call`, {
        method: 'POST',
        body: JSON.stringify({ chairId }),
      })
      await Promise.all([get().fetchQueue(), get().fetchServingList(), get().fetchChairs()])
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  completeService: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: any }>(`/api/queue/${id}/complete`, { method: 'POST' })
      await Promise.all([get().fetchQueue(), get().fetchServingList(), get().fetchChairs()])
      return data.data ? mapQueueEntry(data.data) : null
    } catch (e: any) {
      set({ error: e.message, loading: false })
      return null
    }
  },

  cancelEntry: async (id) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/queue/${id}/cancel`, { method: 'POST' })
      await Promise.all([get().fetchQueue(), get().fetchPriorityQueue(), get().fetchServingList()])
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  promoteEntry: async (id, type, targetPosition) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/queue/${id}/promote`, {
        method: 'POST',
        body: JSON.stringify({ type, targetPosition }),
      })
      await Promise.all([get().fetchQueue(), get().fetchPriorityQueue(), get().fetchServingList()])
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  repositionEntry: async (id, newPosition) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/queue/${id}/position`, {
        method: 'PUT',
        body: JSON.stringify({ newPosition }),
      })
      await get().fetchQueue()
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchPatients: async () => {
    try {
      const data = await apiFetch<{ data: any[] }>('/api/patients')
      set({ patients: data.data.map(mapPatient) })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchChairs: async () => {
    try {
      const data = await apiFetch<{ data: any[] }>('/api/chairs')
      set({ chairs: data.data.map(mapChair) })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  createChair: async (name, location) => {
    set({ loading: true, error: null })
    try {
      await apiFetch('/api/chairs', {
        method: 'POST',
        body: JSON.stringify({ name, location }),
      })
      await get().fetchChairs()
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  updateChair: async (id, name, location) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/chairs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, location }),
      })
      await get().fetchChairs()
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  updateChairStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/chairs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await Promise.all([get().fetchChairs(), get().fetchAppointments(), get().fetchQueue()])
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchAppointments: async (date, chairId, fetchAll = false) => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (!fetchAll && date) params.set('date', date)
      if (chairId) params.set('chairId', String(chairId))
      const query = params.toString()
      const url = `/api/appointments${query ? `?${query}` : ''}`
      const data = await apiFetch<{ data: any[] }>(url)
      set({ appointments: data.data.map(mapAppointment), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchFollowups: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: any[] }>('/api/appointments?type=followup')
      set({ followups: data.data.map(mapAppointment), loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createAppointment: async (chairId, patientName, patientPhone, date, startTime, endTime, type) => {
    set({ loading: true, error: null })
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          chairId,
          patientName,
          patientPhone,
          date,
          startTime,
          endTime,
          type,
        }),
      })
      set({ loading: false })
      await get().fetchAppointments(undefined, undefined, true)
      if (type === 'followup') {
        await get().fetchFollowups()
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  cancelAppointment: async (id) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/appointments/${id}/cancel`, { method: 'PATCH' })
      await Promise.all([get().fetchAppointments(), get().fetchFollowups()])
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  completeAppointment: async (id) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/api/appointments/${id}/complete`, { method: 'PATCH' })
      await Promise.all([get().fetchAppointments(), get().fetchFollowups()])
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createFollowup: async (queueId, chairId, date, startTime, endTime) => {
    set({ loading: true, error: null })
    try {
      await apiFetch('/api/appointments/followup', {
        method: 'POST',
        body: JSON.stringify({ previousQueueId: queueId, chairId, date, startTime, endTime }),
      })
      await Promise.all([get().fetchAppointments(), get().fetchFollowups()])
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  markReminded: async (id, result) => {
    set({ loading: true, error: null })
    try {
      const body: any = {}
      if (result !== undefined) body.result = result
      await apiFetch(`/api/appointments/${id}/reminded`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await Promise.all([get().fetchAppointments(), get().fetchFollowups()])
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  markNoShow: async (id, reason) => {
    set({ loading: true, error: null })
    try {
      const body: any = {}
      if (reason !== undefined) body.reason = reason
      await apiFetch(`/api/appointments/${id}/no-show`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await Promise.all([get().fetchAppointments(), get().fetchFollowups()])
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  markRescheduled: async (id, result) => {
    set({ loading: true, error: null })
    try {
      const body: any = {}
      if (result !== undefined) body.result = result
      await apiFetch(`/api/appointments/${id}/rescheduled`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      await Promise.all([get().fetchAppointments(), get().fetchFollowups()])
      set({ loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  checkConflict: async (chairId, date, startTime, endTime, excludeId) => {
    set({ loading: true, error: null })
    try {
      const body: any = { chairId, date, startTime, endTime }
      if (excludeId) body.excludeId = excludeId
      const data = await apiFetch<{ data: { hasConflict: boolean; conflicts: ConflictDetail[]; suggestions: TimeSlot[] } }>('/api/conflicts/check', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      set({ loading: false })
      return data.data
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  getSuggestions: async (chairId, date, duration) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: TimeSlot[] }>(`/api/conflicts/suggestions?chairId=${chairId}&date=${date}&duration=${duration}`)
      set({ loading: false })
      return data.data
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  getAppointmentById: async (id) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<{ data: any }>(`/api/appointments/${id}`)
      set({ loading: false })
      return mapAppointment(data.data)
    } catch (e: any) {
      set({ error: e.message, loading: false })
      return null
    }
  },

  fetchAppointmentLogs: async (id) => {
    try {
      const data = await apiFetch<{ data: any[] }>(`/api/appointments/${id}/logs`)
      return data.data.map(mapAppointmentLog)
    } catch (e: any) {
      set({ error: e.message })
      return []
    }
  },

  clearError: () => set({ error: null }),
}))
