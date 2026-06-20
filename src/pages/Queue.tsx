import { useEffect, useState } from 'react'
import { Bell, UserPlus, PhoneCall, X, User, Plus, Calendar, CheckCircle, SkipForward } from 'lucide-react'
import { useAppStore, type QueueEntry } from '@/store'

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

export default function Queue() {
  const { queue, servingList, chairs, fetchQueue, fetchServingList, fetchChairs, fetchAppointments, takeNumber, callNext, callSpecific, completeService, cancelEntry, createFollowup } = useAppStore()
  const [showTakeNumber, setShowTakeNumber] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', type: 'normal' })
  const [completeModal, setCompleteModal] = useState<QueueEntry | null>(null)
  const [showFollowup, setShowFollowup] = useState(false)
  const [followupForm, setFollowupForm] = useState({
    patientName: '',
    patientPhone: '',
    date: '',
    chairId: 0,
    startTime: '',
    endTime: '',
  })
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  useEffect(() => {
    fetchQueue()
    fetchServingList()
    fetchChairs()
  }, [fetchQueue, fetchServingList, fetchChairs])

  const waitingList = queue.filter((q) => q.status === 'waiting')
  const availableChairs = chairs.filter((c) => c.status === 'available')

  const handleTakeNumber = async () => {
    if (!form.name || !form.phone) return
    await takeNumber(form.name, form.phone, form.type)
    setForm({ name: '', phone: '', type: 'normal' })
    setShowTakeNumber(false)
  }

  const handleCallNext = async (chairId: number) => {
    await callNext(chairId)
  }

  const handleCallSpecific = async (id: number, chairId: number) => {
    await callSpecific(id, chairId)
  }

  const handleCompleteClick = (entry: QueueEntry) => {
    setCompleteModal(entry)
  }

  const handleDirectComplete = async () => {
    if (!completeModal) return
    await completeService(completeModal.id)
    setCompleteModal(null)
    showToast('就诊已完成')
  }

  const handleCompleteWithFollowup = async () => {
    if (!completeModal) return
    await completeService(completeModal.id)

    const now = new Date()
    const defaultChair = chairs.find((c) => c.id === completeModal.chairId) || chairs[0]

    setFollowupForm({
      patientName: completeModal.patientName,
      patientPhone: completeModal.patientPhone,
      date: addDays(now, 7),
      chairId: defaultChair?.id || 0,
      startTime: roundToNext30Minutes(now),
      endTime: add30Minutes(roundToNext30Minutes(now)),
    })

    setCompleteModal(null)
    setShowFollowup(true)
  }

  const handleCreateFollowup = async () => {
    if (!completeModal || !followupForm.chairId) return
    await createFollowup(
      completeModal.id,
      followupForm.chairId,
      followupForm.date,
      followupForm.startTime,
      followupForm.endTime,
    )
    await fetchAppointments()
    setShowFollowup(false)
    showToast('复诊预约成功')
  }

  const handleCancel = async (id: number) => {
    await cancelEntry(id)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-success text-white rounded-lg shadow-lg text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}

      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">完成就诊</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              患者 <span className="font-medium text-[var(--color-text)]">{completeModal.patientName}</span> 的就诊已完成？
            </p>
            <p className="text-sm font-medium text-[var(--color-text)] mb-4">是否需要预约复诊？</p>
            <div className="space-y-2">
              <button
                onClick={handleCompleteWithFollowup}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <Calendar className="w-4 h-4 inline mr-1.5" />
                预约复诊
              </button>
              <button
                onClick={handleDirectComplete}
                className="w-full py-2.5 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-1.5" />
                直接完成
              </button>
              <button
                onClick={() => setCompleteModal(null)}
                className="w-full py-2.5 text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text)] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-success" />
              预约复诊
            </h3>

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
                  setShowFollowup(false)
                  setCompleteModal(null)
                }}
                className="w-full py-2.5 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <SkipForward className="w-4 h-4 inline mr-1.5" />
                跳过
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-[var(--color-text)]">叫号管理</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">
            等待 {waitingList.length} 人
          </span>
          <button
            onClick={() => setShowTakeNumber(!showTakeNumber)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            取号
          </button>
        </div>
      </div>

      {showTakeNumber && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up space-y-3">
          <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            患者取号
          </h3>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">患者姓名</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">联系电话</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="请输入电话"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">就诊类型</label>
            <div className="flex gap-2">
              {[
                { value: 'normal', label: '普通', cls: 'bg-primary-50 text-primary border-primary' },
                { value: 'vip', label: 'VIP', cls: 'bg-warning-50 text-warning border-warning' },
                { value: 'emergency', label: '急诊', cls: 'bg-danger-50 text-danger border-danger' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, type: opt.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.type === opt.value
                      ? opt.cls
                      : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTakeNumber}
              className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              确认取号
            </button>
            <button
              onClick={() => setShowTakeNumber(false)}
              className="flex-1 py-2 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {availableChairs.length > 0 && waitingList.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-[var(--color-text)] mb-3">呼叫下一位</h3>
          <div className="flex flex-wrap gap-2">
            {availableChairs.map((chair) => (
              <button
                key={chair.id}
                onClick={() => handleCallNext(chair.id)}
                className="relative flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm hover:shadow-md"
              >
                <span className="absolute inset-0 rounded-xl animate-pulse-ring border-2 border-primary opacity-0" />
                <PhoneCall className="w-4 h-4" />
                <span className="text-sm font-medium">{chair.name} 呼叫</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-[var(--color-text)] mb-3">等待队列</h3>
        {waitingList.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">暂无等待患者</p>
        ) : (
          <div className="space-y-2">
            {waitingList.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl border border-[var(--color-border)] hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="number-font text-lg font-bold text-primary w-12">
                    {entry.queueNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                      <span className="text-sm font-medium">{entry.patientName}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {entry.type === 'vip' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning-50 text-warning">VIP</span>
                      )}
                      {entry.type === 'emergency' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger-50 text-danger">急诊</span>
                      )}
                      {entry.type === 'normal' && (
                        <span className="text-[var(--color-text-secondary)]">普通</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {availableChairs.map((chair) => (
                    <button
                      key={chair.id}
                      onClick={() => handleCallSpecific(entry.id, chair.id)}
                      className="px-2.5 py-1 text-xs bg-primary-50 text-primary rounded-md hover:bg-primary-100 transition-colors font-medium"
                    >
                      {chair.name}
                    </button>
                  ))}
                  <button
                    onClick={() => handleCancel(entry.id)}
                    className="p-1.5 text-[var(--color-text-secondary)] hover:text-danger transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {servingList.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-[var(--color-text)] mb-3">就诊中</h3>
          <div className="space-y-2">
            {servingList.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-success-50 border border-success/20"
              >
                <div className="flex items-center gap-3">
                  <span className="number-font text-lg font-bold text-success">{entry.queueNumber}</span>
                  <div>
                    <span className="text-sm font-medium">{entry.patientName}</span>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {entry.chairName || (entry.chairId ? `椅位${entry.chairId}` : '')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteClick(entry)}
                  className="px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:bg-success-light transition-colors font-medium"
                >
                  完成就诊
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
