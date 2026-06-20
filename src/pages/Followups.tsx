import { useEffect, useState, useMemo } from 'react'
import { Stethoscope, RefreshCw, Search, Calendar, Clock, MapPin, User, Phone, CheckCircle, XCircle, X, Plus, CalendarDays } from 'lucide-react'
import { useAppStore, type Appointment } from '@/store'

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

function roundToNext30Minutes(date: Date): string {
  const minutes = date.getMinutes()
  const rounded = Math.ceil(minutes / 30) * 30
  const hours = date.getHours() + Math.floor(rounded / 60)
  const mins = rounded % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function add30Minutes(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + 30
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const patientTypeBadge: Record<string, { text: string; cls: string }> = {
  vip: { text: 'VIP', cls: 'bg-warning-50 text-warning' },
  emergency: { text: '急诊', cls: 'bg-danger-50 text-danger' },
}

const statusLabels: Record<string, { text: string; cls: string }> = {
  scheduled: { text: '已预约', cls: 'bg-primary-50 text-primary' },
  in_progress: { text: '进行中', cls: 'bg-success-50 text-success' },
  completed: { text: '已完成', cls: 'bg-gray-100 text-gray-500' },
  cancelled: { text: '已取消', cls: 'bg-danger-50 text-danger' },
}

const prevTypeLabels: Record<string, string> = {
  normal: '普通',
  vip: 'VIP',
  emergency: '急诊',
  followup: '复诊',
}

export default function Followups() {
  const {
    followups,
    chairs,
    loading,
    fetchChairs,
    fetchFollowups,
    completeAppointment,
    cancelAppointment,
    createFollowup,
  } = useAppStore()

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFollowupModal, setShowFollowupModal] = useState(false)
  const [selectedFollowup, setSelectedFollowup] = useState<Appointment | null>(null)
  const [followupForm, setFollowupForm] = useState({
    patientName: '',
    patientPhone: '',
    date: '',
    chairId: 0,
    startTime: '',
    endTime: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  useEffect(() => {
    fetchChairs()
    fetchFollowups()
  }, [fetchChairs, fetchFollowups])

  const filteredFollowups = useMemo(() => {
    return followups.filter((f) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = f.patientName.toLowerCase().includes(q)
        const matchPhone = f.patientPhone.includes(q)
        if (!matchName && !matchPhone) return false
      }
      if (dateFrom && f.appointmentDate < dateFrom) return false
      if (dateTo && f.appointmentDate > dateTo) return false
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      return true
    })
  }, [followups, search, dateFrom, dateTo, statusFilter])

  const handleRefresh = () => {
    fetchChairs()
    fetchFollowups()
  }

  const handleComplete = async (id: number) => {
    await completeAppointment(id)
    showToast('复诊已完成')
  }

  const handleCancel = async (id: number) => {
    await cancelAppointment(id)
    showToast('预约已取消')
  }

  const openFollowupModal = (followup: Appointment) => {
    const now = new Date()
    const defaultChair = chairs.find((c) => c.id === followup.chairId) || chairs[0]
    setSelectedFollowup(followup)
    setFollowupForm({
      patientName: followup.patientName,
      patientPhone: followup.patientPhone,
      date: addDays(now, 7),
      chairId: defaultChair?.id || 0,
      startTime: roundToNext30Minutes(now),
      endTime: add30Minutes(roundToNext30Minutes(now)),
    })
    setFormError(null)
    setShowFollowupModal(true)
  }

  const handleCreateFollowup = async () => {
    if (!selectedFollowup || !followupForm.chairId) {
      setFormError('请选择椅位')
      return
    }
    const queueId = selectedFollowup.queueId ?? selectedFollowup.previousQueueId
    if (!queueId) {
      setFormError('无法找到关联的就诊记录')
      return
    }
    try {
      await createFollowup(
        queueId,
        followupForm.chairId,
        followupForm.date,
        followupForm.startTime,
        followupForm.endTime,
      )
      setShowFollowupModal(false)
      setSelectedFollowup(null)
      showToast('复诊预约成功')
    } catch (e: any) {
      setFormError(e.message || '预约失败')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-success text-white rounded-lg shadow-lg text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}

      {showFollowupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-success" />
                再约一次
              </h3>
              <button
                onClick={() => {
                  setShowFollowupModal(false)
                  setSelectedFollowup(null)
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">患者姓名</label>
                <input
                  type="text"
                  value={followupForm.patientName}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-gray-50 text-[var(--color-text-secondary)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">联系电话</label>
                <input
                  type="text"
                  value={followupForm.patientPhone}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm bg-gray-50 text-[var(--color-text-secondary)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success-50 text-success mr-2">复诊</span>
                  就诊类型
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-success-50 text-success">
                    复诊预约
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">复诊日期</label>
                <input
                  type="date"
                  value={followupForm.date}
                  onChange={(e) => setFollowupForm({ ...followupForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">椅位</label>
                <select
                  value={followupForm.chairId}
                  onChange={(e) => setFollowupForm({ ...followupForm, chairId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value={0}>请选择椅位</option>
                  {chairs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">开始时间</label>
                  <input
                    type="time"
                    value={followupForm.startTime}
                    onChange={(e) => {
                      const newStart = e.target.value
                      const newEnd = add30Minutes(newStart)
                      setFollowupForm({ ...followupForm, startTime: newStart, endTime: newEnd })
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">结束时间</label>
                  <input
                    type="time"
                    value={followupForm.endTime}
                    onChange={(e) => setFollowupForm({ ...followupForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
              {formError && (
                <div className="flex items-center gap-1.5 text-xs text-danger">
                  <XCircle className="w-3.5 h-3.5" />
                  {formError}
                </div>
              )}
            </div>

            <div className="space-y-2 mt-6">
              <button
                onClick={handleCreateFollowup}
                className="w-full py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-light transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-1.5" />
                确认预约复诊
              </button>
              <button
                onClick={() => {
                  setShowFollowupModal(false)
                  setSelectedFollowup(null)
                }}
                className="w-full py-2.5 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-[var(--color-text)]">复诊管理</h2>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[var(--color-border)] text-[var(--color-text)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">患者搜索</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名或手机号"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">开始日期</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">结束日期</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">状态</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '全部' },
              { value: 'scheduled', label: '已预约' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === opt.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-[var(--color-text-secondary)] hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredFollowups.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">暂无复诊记录</p>
          <p className="text-[var(--color-text-secondary)] text-xs mt-1">调整筛选条件或稍后重试</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFollowups.map((followup) => {
            const chair = chairs.find((c) => c.id === followup.chairId)
            const patientBadge = patientTypeBadge[followup.type]
            const statusInfo = statusLabels[followup.status] || { text: followup.status, cls: 'bg-gray-100 text-gray-500' }
            const hasPrev = followup.previousVisitDate || followup.previousVisitChair || followup.previousVisitType

            return (
              <div
                key={followup.id}
                className="bg-white rounded-xl p-4 shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-[var(--color-text)]">{followup.patientName}</span>
                      {patientBadge && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${patientBadge.cls}`}>
                          {patientBadge.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-[var(--color-text-secondary)]">
                      <Phone className="w-3 h-3" />
                      {followup.patientPhone}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusInfo.cls} flex-shrink-0`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <span className="text-[var(--color-text)]">{followup.appointmentDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <span className="text-[var(--color-text)]">{followup.startTime} - {followup.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    <span className="text-[var(--color-text)]">
                      {followup.chairName || chair?.name || `椅位${followup.chairId}`}
                      {chair?.location ? ` · ${chair.location}` : ''}
                    </span>
                  </div>
                </div>

                {hasPrev && (
                  <div className="bg-success-50 rounded-lg p-3 border border-success/10">
                    <div className="text-xs font-semibold text-success flex items-center gap-1.5 mb-1.5">
                      <User className="w-3 h-3" />
                      上次就诊
                    </div>
                    <div className="space-y-1 text-xs">
                      {followup.previousVisitDate && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <Calendar className="w-3 h-3" />
                          <span>{String(followup.previousVisitDate).split('T')[0]}</span>
                        </div>
                      )}
                      {followup.previousVisitChair && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <MapPin className="w-3 h-3" />
                          <span>{followup.previousVisitChair}</span>
                        </div>
                      )}
                      {followup.previousVisitType && (
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            followup.previousVisitType === 'vip' ? 'bg-warning-50 text-warning' :
                            followup.previousVisitType === 'emergency' ? 'bg-danger-50 text-danger' :
                            followup.previousVisitType === 'followup' ? 'bg-success-50 text-success' :
                            'bg-primary-50 text-primary'
                          }`}>
                            {prevTypeLabels[followup.previousVisitType] || followup.previousVisitType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {followup.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleComplete(followup.id)}
                        className="flex-1 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-light transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        完成复诊
                      </button>
                      <button
                        onClick={() => handleCancel(followup.id)}
                        className="flex-1 py-2 bg-danger/10 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        取消预约
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openFollowupModal(followup)}
                    className={`${followup.status === 'scheduled' ? '' : 'flex-1'} py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1 ${followup.status === 'scheduled' ? 'px-3' : ''}`}
                  >
                    <Plus className="w-4 h-4" />
                    再约一次
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
