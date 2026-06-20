import { useEffect, useState, useMemo } from 'react'
import { Calendar, Plus, Clock, X, User, Phone, MapPin, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Stethoscope, BarChart3 } from 'lucide-react'
import { useAppStore, type Appointment, type DentalChair } from '@/store'

function add30Minutes(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + 30
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function getCurrentTimeRounded(): string {
  const now = new Date()
  const minutes = now.getMinutes()
  const rounded = Math.ceil(minutes / 30) * 30
  const hours = now.getHours() + Math.floor(rounded / 60)
  const mins = rounded % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function getMinTime(date: string): string {
  const today = formatDate(new Date())
  if (date === today) {
    const currentRounded = getCurrentTimeRounded()
    return timeToMinutes(currentRounded) > timeToMinutes('08:00') ? currentRounded : '08:00'
  }
  return '08:00'
}

function getAppointmentTop(startTime: string): number {
  return ((timeToMinutes(startTime) - 480) / 30) * 60
}

function getAppointmentHeight(startTime: string, endTime: string): number {
  return ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 30) * 60
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatDate(d)
}

function getWeekDates(dateStr: string): string[] {
  const monday = getWeekStart(dateStr)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const typeColors: Record<string, string> = {
  normal: 'bg-primary text-white',
  vip: 'bg-warning text-white',
  emergency: 'bg-danger text-white',
  followup: 'bg-success text-white',
}

const typeLabels: Record<string, string> = {
  normal: '普通',
  vip: 'VIP',
  emergency: '急诊',
  followup: '复诊',
}

const statusLabels: Record<string, { text: string; cls: string }> = {
  scheduled: { text: '已预约', cls: 'bg-primary/10 text-primary' },
  in_progress: { text: '进行中', cls: 'bg-success/10 text-success' },
  completed: { text: '已完成', cls: 'bg-gray-100 text-gray-500' },
  cancelled: { text: '已取消', cls: 'bg-danger/10 text-danger' },
}

function getLoadStyle(minutes: number) {
  if (minutes === 0) return 'bg-gray-50 text-gray-500'
  if (minutes > 480) return 'bg-danger/10 text-danger'
  if (minutes >= 240) return 'bg-warning/10 text-warning'
  return 'bg-success/10 text-success'
}

interface AvailableSlot {
  startTime: string
  endTime: string
}

function getAvailableSlots(chairAppointments: Appointment[], date: string): { morning: AvailableSlot[]; afternoon: AvailableSlot[] } {
  const dayApts = chairAppointments.filter(a => a.appointmentDate === date && a.status !== 'cancelled')
  const allSlots = getTimeSlots()
  const busySlots = new Set<string>()

  dayApts.forEach(apt => {
    const startMin = timeToMinutes(apt.startTime)
    const endMin = timeToMinutes(apt.endTime)
    allSlots.forEach(slot => {
      const slotMin = timeToMinutes(slot)
      if (slotMin >= startMin && slotMin < endMin) {
        busySlots.add(slot)
      }
    })
  })

  const freeSlots = allSlots.filter(slot => !busySlots.has(slot) && timeToMinutes(slot) < timeToMinutes('18:00'))

  const morning: AvailableSlot[] = []
  const afternoon: AvailableSlot[] = []

  freeSlots.forEach(slot => {
    const slotItem = { startTime: slot, endTime: add30Minutes(slot) }
    if (timeToMinutes(slot) < timeToMinutes('12:00')) {
      morning.push(slotItem)
    } else {
      afternoon.push(slotItem)
    }
  })

  return { morning, afternoon }
}

export default function Schedule() {
  const {
    chairs,
    appointments,
    error,
    fetchChairs,
    fetchAppointments,
    createAppointment,
    cancelAppointment,
    getAppointmentById,
    createChair,
    clearError,
  } = useAppStore()

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showChairForm, setShowChairForm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [chairForm, setChairForm] = useState({ name: '', location: '' })
  const [form, setForm] = useState({
    chairId: 0,
    patientName: '',
    patientPhone: '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '09:30',
    type: 'normal' as 'normal' | 'vip' | 'emergency' | 'followup',
  })
  const [timeError, setTimeError] = useState<string | null>(null)
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null)
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())

  const timeSlots = useMemo(() => getTimeSlots(), [])
  const availableChairs = useMemo(() => chairs.filter(c => c.status !== 'maintenance'), [chairs])
  const today = formatDate(new Date())
  const minTime = getMinTime(form.date)
  const maxTime = '18:00'
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate])
  const thisWeekStart = useMemo(() => getWeekStart(today), [today])

  useEffect(() => {
    setTimeError(timeToMinutes(form.endTime) <= timeToMinutes(form.startTime) ? '结束时间必须晚于开始时间' : null)
  }, [form.startTime, form.endTime])

  useEffect(() => { fetchChairs() }, [fetchChairs])

  useEffect(() => {
    if (viewMode === 'day') {
      fetchAppointments(selectedDate)
    } else {
      fetchAppointments(undefined, undefined, true)
    }
  }, [fetchAppointments, selectedDate, viewMode])

  const handleViewModeChange = (mode: 'day' | 'week') => {
    setViewMode(mode)
    if (mode === 'week') {
      setSelectedDate(getWeekStart(selectedDate))
    }
  }

  const openFormForCell = (chair: DentalChair, date: string, time?: string, endTime?: string) => {
    const startTime = time && timeToMinutes(time) >= timeToMinutes('08:00') ? time : '09:00'
    setForm({
      chairId: chair.id,
      patientName: '',
      patientPhone: '',
      date,
      startTime,
      endTime: endTime || add30Minutes(startTime),
      type: 'normal',
    })
    setFormSubmitError(null)
    clearError()
    setShowForm(true)
  }

  const toggleExpand = (key: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleCellClick = (chair: DentalChair, time: string) => {
    let startTime = time
    if (timeToMinutes(time) < timeToMinutes(minTime)) {
      startTime = minTime
    }
    openFormForCell(chair, selectedDate, startTime)
  }

  const handleStartTimeChange = (value: string) => {
    const newStartTime = value
    let newEndTime = form.endTime
    if (timeToMinutes(newEndTime) <= timeToMinutes(newStartTime)) {
      newEndTime = add30Minutes(newStartTime)
    }
    setForm({ ...form, startTime: newStartTime, endTime: newEndTime })
  }

  const handleAppointmentClick = async (apt: Appointment) => {
    const detail = await getAppointmentById(apt.id)
    if (detail) {
      setSelectedAppointment(detail)
      setShowDetail(true)
    }
  }

  const handleSubmit = async () => {
    if (!form.chairId || !form.patientName || !form.patientPhone || timeError) return
    setFormSubmitError(null)
    clearError()
    try {
      await createAppointment(form.chairId, form.patientName, form.patientPhone, form.date, form.startTime, form.endTime, form.type)
      const currentError = useAppStore.getState().error
      if (currentError) {
        setFormSubmitError(currentError)
        return
      }
      setShowForm(false)
    } catch (e: any) {
      setFormSubmitError(e.message || '创建预约失败')
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return
    await cancelAppointment(selectedAppointment.id)
    setShowDetail(false)
    setSelectedAppointment(null)
  }

  const handleCreateChair = async () => {
    if (!chairForm.name || !chairForm.location) return
    await createChair(chairForm.name, chairForm.location)
    setShowChairForm(false)
    setChairForm({ name: '', location: '' })
  }

  const closeForm = () => {
    setShowForm(false)
    setFormSubmitError(null)
    clearError()
  }

  const getAppointmentsForChair = (chairId: number) =>
    appointments.filter(a => a.chairId === chairId && a.appointmentDate === selectedDate)

  const getAppointmentsForChairAndDate = (chairId: number, date: string) =>
    appointments.filter(a => a.chairId === chairId && a.appointmentDate === date)

  const getSelectedChair = () => chairs.find(c => c.id === form.chairId)

  const getChairStats = (chair: DentalChair) => {
    return weekDates.map(date => {
      const dayApts = getAppointmentsForChairAndDate(chair.id, date)
      const bookedMinutes = dayApts.reduce((sum, a) => sum + (timeToMinutes(a.endTime) - timeToMinutes(a.startTime)), 0)
      const followupCount = dayApts.filter(a => a.type === 'followup').length
      const totalCount = dayApts.length
      const followupRatio = totalCount > 0 ? Math.round((followupCount / totalCount) * 100) : 0
      return {
        date,
        count: totalCount,
        bookedMinutes,
        freeMinutes: 600 - bookedMinutes,
        followupRatio,
      }
    })
  }

  const renderDayView = () => (
    <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex border-b border-gray-200">
        <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200" />
        <div className="flex overflow-x-auto">
          {availableChairs.map((chair) => (
            <div key={chair.id} className="w-[180px] flex-shrink-0 p-3 border-r border-gray-200 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Stethoscope className="w-4 h-4 text-primary" />
                <span className="font-semibold text-gray-800">{chair.name}</span>
              </div>
              <div className="text-xs text-gray-500">{chair.location}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200">
            {timeSlots.map((time) => (
              <div key={time} className="h-[60px] border-b border-gray-100 flex items-start justify-end pr-2 pt-1 text-xs text-gray-500">{time}</div>
            ))}
          </div>
          <div className="flex">
            {availableChairs.map((chair) => {
              const chairAppointments = getAppointmentsForChair(chair.id)
              return (
                <div key={chair.id} className="w-[180px] flex-shrink-0 border-r border-gray-200 relative">
                  {timeSlots.map((time) => {
                    const isPast = selectedDate === today && timeToMinutes(time) < timeToMinutes(minTime)
                    return (
                      <div
                        key={`${chair.id}-${time}`}
                        onClick={() => !isPast && handleCellClick(chair, time)}
                        className={`h-[60px] border-b border-gray-100 transition-colors ${
                          isPast
                            ? 'bg-gray-50 cursor-not-allowed'
                            : 'hover:bg-primary/5 cursor-pointer'
                        }`}
                      />
                    )
                  })}
                  {chairAppointments.map((apt) => {
                    const top = getAppointmentTop(apt.startTime)
                    const height = getAppointmentHeight(apt.startTime, apt.endTime)
                    const isCancelled = apt.status === 'cancelled'
                    return (
                      <div
                        key={apt.id}
                        className={`absolute left-1 right-1 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden ${typeColors[apt.type] || typeColors.normal} ${isCancelled ? 'opacity-50' : ''}`}
                        style={{ top: `${top}px`, height: `${height - 4}px` }}
                        onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt) }}
                      >
                        <div className={`text-sm font-medium truncate ${isCancelled ? 'line-through' : ''}`}>{apt.patientName}</div>
                        <div className={`text-xs opacity-90 ${isCancelled ? 'line-through' : ''}`}>{apt.startTime} - {apt.endTime}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">{typeLabels[apt.type] || apt.type}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderWeekStats = () => (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-gray-800">牙椅负载统计</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {availableChairs.map((chair) => {
          const stats = getChairStats(chair)
          const chairAppointments = appointments.filter(a => a.chairId === chair.id)
          return (
            <div key={chair.id} className="flex-1 min-w-[260px] bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                <span className="font-semibold text-gray-800 text-sm">{chair.name}</span>
                <span className="text-xs text-gray-500">· {chair.location}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {stats.map((stat, idx) => {
                  const expandKey = `${chair.id}-${stat.date}`
                  const isExpanded = expandedSlots.has(expandKey)
                  const { morning, afternoon } = getAvailableSlots(chairAppointments, stat.date)
                  return (
                    <div key={stat.date} className="flex flex-col">
                      <div
                        onClick={() => toggleExpand(expandKey)}
                        className={`rounded-lg p-1.5 text-center cursor-pointer hover:opacity-80 transition-opacity ${getLoadStyle(stat.bookedMinutes)}`}
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          <span className="text-[10px] font-medium">{weekDayLabels[idx]}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 opacity-70" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-70" />
                          )}
                        </div>
                        <div className="text-xs font-bold">{stat.count}单</div>
                        <div className="text-[10px]">{stat.bookedMinutes}分</div>
                        <div className="text-[10px] opacity-75">闲{stat.freeMinutes}</div>
                        {stat.count > 0 && <div className="text-[10px]">复诊{stat.followupRatio}%</div>}
                      </div>
                      {isExpanded && (
                        <div className="mt-1 p-2 bg-white rounded-lg border border-gray-200 space-y-2 animate-fade-in">
                          {morning.length > 0 && (
                            <div>
                              <div className="text-[10px] font-medium text-gray-600 mb-1">上午 08:00-12:00</div>
                              <div className="flex flex-wrap gap-1">
                                {morning.map((slot) => (
                                  <button
                                    key={`m-${slot.startTime}`}
                                    onClick={(e) => { e.stopPropagation(); openFormForCell(chair, stat.date, slot.startTime, slot.endTime) }}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success hover:bg-success hover:text-white transition-colors"
                                  >
                                    {slot.startTime}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {afternoon.length > 0 && (
                            <div>
                              <div className="text-[10px] font-medium text-gray-600 mb-1">下午 12:00-18:00</div>
                              <div className="flex flex-wrap gap-1">
                                {afternoon.map((slot) => (
                                  <button
                                    key={`a-${slot.startTime}`}
                                    onClick={(e) => { e.stopPropagation(); openFormForCell(chair, stat.date, slot.startTime, slot.endTime) }}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success hover:bg-success hover:text-white transition-colors"
                                  >
                                    {slot.startTime}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {morning.length === 0 && afternoon.length === 0 && (
                            <div className="text-[10px] text-gray-400 text-center py-1">无可预约时段</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderWeekGrid = () => (
    <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex border-b border-gray-200">
        <div className="w-[120px] flex-shrink-0 bg-gray-50 border-r border-gray-200 p-3 text-center">
          <span className="text-xs text-gray-500">牙椅</span>
        </div>
        {weekDates.map((date, idx) => {
          const isToday = date === today
          return (
            <div key={date} className="flex-1 min-w-[100px] p-2 border-r border-gray-200 text-center">
              <div className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-gray-600'}`}>{weekDayLabels[idx]}</div>
              <div className={`text-sm font-bold ${isToday ? 'bg-primary text-white rounded-full w-7 h-7 inline-flex items-center justify-center mt-0.5' : 'text-gray-800'}`}>
                {date.slice(5).replace('-', '/')}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex-1 overflow-auto">
        {availableChairs.map((chair) => (
          <div key={chair.id} className="flex border-b border-gray-100 min-h-[90px]">
            <div className="w-[120px] flex-shrink-0 bg-gray-50 border-r border-gray-200 p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-gray-800 text-sm">{chair.name}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate">{chair.location}</div>
            </div>
            {weekDates.map((date) => {
              const dayApts = getAppointmentsForChairAndDate(chair.id, date)
              return (
                <div
                  key={`${chair.id}-${date}`}
                  onClick={() => openFormForCell(chair, date)}
                  className="flex-1 min-w-[100px] border-r border-gray-100 p-1.5 cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    {dayApts.map((apt) => {
                      const isCancelled = apt.status === 'cancelled'
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt) }}
                          className={`rounded px-1.5 py-1 cursor-pointer transition-all hover:scale-[1.01] ${typeColors[apt.type] || typeColors.normal} ${isCancelled ? 'opacity-50 line-through' : ''}`}
                        >
                          <div className="text-[11px] font-medium truncate">{apt.patientName.slice(0, 2)}</div>
                          <div className="text-[10px] opacity-90">{apt.startTime}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  const renderWeekView = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div style={{ height: '40%' }} className="flex-shrink-0 overflow-auto">
        {renderWeekStats()}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {renderWeekGrid()}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">日程排期</h2>
          </div>
          {viewMode === 'day' ? (
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
              <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="px-3 py-1 text-sm hover:bg-gray-100 rounded transition-colors">昨天</button>
              <button onClick={() => setSelectedDate(today)} className={`px-3 py-1 text-sm rounded transition-colors ${selectedDate === today ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>今天</button>
              <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="px-3 py-1 text-sm hover:bg-gray-100 rounded transition-colors">明天</button>
              <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="date"
                value={selectedDate}
                min={today}
                onChange={(e) => {
                  const newDate = e.target.value
                  const newMinTime = getMinTime(newDate)
                  let newStartTime = form.startTime
                  if (timeToMinutes(form.startTime) < timeToMinutes(newMinTime)) {
                    newStartTime = newMinTime
                  }
                  let newEndTime = form.endTime
                  if (timeToMinutes(newEndTime) <= timeToMinutes(newStartTime)) {
                    newEndTime = add30Minutes(newStartTime)
                  }
                  setSelectedDate(newDate)
                  setForm({ ...form, date: newDate, startTime: newStartTime, endTime: newEndTime })
                }}
                className="ml-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
              <button onClick={() => setSelectedDate(addDays(weekStart, -7))} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => setSelectedDate(thisWeekStart)} className={`px-3 py-1 text-sm rounded transition-colors ${weekStart === thisWeekStart ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>本周</button>
              <button onClick={() => setSelectedDate(addDays(weekStart, 7))} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <span className="ml-2 px-3 py-1.5 text-sm text-gray-700">{weekDates[0].slice(5).replace('-', '/')} - {weekDates[6].slice(5).replace('-', '/')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => handleViewModeChange('day')}
              className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${viewMode === 'day' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              日视图
            </button>
            <button
              onClick={() => handleViewModeChange('week')}
              className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${viewMode === 'week' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              周视图
            </button>
          </div>
          <button onClick={() => setShowChairForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm">
            <Plus className="w-4 h-4" />新增牙椅
          </button>
        </div>
      </div>

      {viewMode === 'day' ? renderDayView() : renderWeekView()}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">新增预约</h3>
              <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">患者姓名</label>
                  <input type="text" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="请输入姓名" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">联系电话</label>
                  <input type="tel" value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="请输入电话" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option value="normal">普通</option>
                  <option value="vip">VIP</option>
                  <option value="emergency">急诊</option>
                  <option value="followup">复诊</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">日期</label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">{form.date}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">椅位</label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-700">{getSelectedChair()?.name || '未选择'} · {getSelectedChair()?.location || ''}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">开始时间</label>
                  <input
                    type="time"
                    value={form.startTime}
                    min={minTime}
                    max={maxTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">结束时间</label>
                  <input
                    type="time"
                    value={form.endTime}
                    min={minTime}
                    max={maxTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className={timeError
                      ? 'w-full px-3 py-2 rounded-lg border border-danger text-sm focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger'
                      : 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
                    }
                  />
                </div>
              </div>
              {timeError && <div className="flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="w-3.5 h-3.5" />{timeError}</div>}
              {(formSubmitError || error) && (
                <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-danger">{formSubmitError || error}</span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!!timeError}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认预约
                </button>
                <button onClick={closeForm} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetail && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">预约详情</h3>
              <button onClick={() => { setShowDetail(false); setSelectedAppointment(null) }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${typeColors[selectedAppointment.type] || typeColors.normal}`}>
                <div className="text-xl font-bold">{selectedAppointment.patientName}</div>
                <div className="text-sm opacity-90 mt-1">{selectedAppointment.startTime} - {selectedAppointment.endTime}</div>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-white/20">{typeLabels[selectedAppointment.type] || selectedAppointment.type}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{selectedAppointment.patientPhone}</span></div>
                <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{selectedAppointment.chairName || `椅位${selectedAppointment.chairId}`}</span></div>
                <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{selectedAppointment.appointmentDate}</span></div>
                <div className="flex items-center gap-3 text-sm"><Clock className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{selectedAppointment.startTime} - {selectedAppointment.endTime}</span></div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusLabels[selectedAppointment.status]?.cls || ''}`}>{statusLabels[selectedAppointment.status]?.text || selectedAppointment.status}</span>
                </div>
              </div>
              {selectedAppointment.type === 'followup' && selectedAppointment.previousVisitDate && (
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="text-sm font-medium text-success flex items-center gap-1.5">复诊 · 上次就诊</div>
                  <div className="text-xs text-gray-600 mt-1">
                    日期: {selectedAppointment.previousVisitDate.split('T')[0]}
                    {selectedAppointment.previousVisitChair && <span className="ml-2">椅位: {selectedAppointment.previousVisitChair}</span>}
                  </div>
                </div>
              )}
              {selectedAppointment.status === 'scheduled' && (
                <button onClick={handleCancelAppointment} className="w-full py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors">取消预约</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showChairForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">新增牙椅</h3>
              <button onClick={() => setShowChairForm(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">牙椅名称</label>
                <input type="text" value={chairForm.name} onChange={(e) => setChairForm({ ...chairForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="例如：1号牙椅" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">位置</label>
                <input type="text" value={chairForm.location} onChange={(e) => setChairForm({ ...chairForm, location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="例如：一楼A区" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleCreateChair} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">确认添加</button>
                <button onClick={() => setShowChairForm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
