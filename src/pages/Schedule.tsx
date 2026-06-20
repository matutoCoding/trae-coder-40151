import { useEffect, useState } from 'react'
import { Calendar, Plus, Clock, X, CheckCircle, User } from 'lucide-react'
import { useAppStore } from '@/store'

export default function Schedule() {
  const { appointments, chairs, fetchAppointments, fetchChairs, createAppointment, cancelAppointment } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    chairId: 0,
    patientName: '',
    patientPhone: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'normal',
  })

  useEffect(() => {
    fetchAppointments()
    fetchChairs()
  }, [fetchAppointments, fetchChairs])

  const handleSubmit = async () => {
    if (!form.chairId || !form.patientName || !form.patientPhone) return
    await createAppointment(
      form.chairId,
      form.patientName,
      form.patientPhone,
      form.date,
      form.startTime,
      form.endTime,
      form.type,
    )
    setShowForm(false)
    setForm((prev) => ({
      ...prev,
      patientName: '',
      patientPhone: '',
      type: 'normal',
    }))
  }

  const handleCancel = async (id: number) => {
    await cancelAppointment(id)
  }

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, apt) => {
    const date = apt.appointmentDate
    if (!acc[date]) acc[date] = []
    acc[date].push(apt)
    return acc
  }, {})

  const statusLabel: Record<string, { text: string; cls: string }> = {
    scheduled: { text: '已预约', cls: 'bg-primary-50 text-primary' },
    in_progress: { text: '进行中', cls: 'bg-success-50 text-success' },
    completed: { text: '已完成', cls: 'bg-gray-100 text-gray-500' },
    cancelled: { text: '已取消', cls: 'bg-danger-50 text-danger' },
  }

  const typeLabel: Record<string, string> = {
    normal: '普通',
    vip: 'VIP',
    emergency: '急诊',
    followup: '复诊',
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-[var(--color-text)]">预约排期</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">椅位</label>
              <select
                value={form.chairId}
                onChange={(e) => setForm({ ...form, chairId: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value={0}>请选择椅位</option>
                {chairs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="normal">普通</option>
                <option value="vip">VIP</option>
                <option value="emergency">急诊</option>
                <option value="followup">复诊</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">患者姓名</label>
            <input
              type="text"
              value={form.patientName}
              onChange={(e) => setForm({ ...form, patientName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">联系电话</label>
            <input
              type="tel"
              value={form.patientPhone}
              onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="请输入电话"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">日期</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">开始时间</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">结束时间</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              确认预约
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Calendar className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[var(--color-text-secondary)]">暂无预约记录</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, apts]) => (
            <div key={date} className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {date}
              </h3>
              <div className="space-y-2">
                {apts.map((apt) => {
                  const st = statusLabel[apt.status] || statusLabel.scheduled
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[var(--color-border)] hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                          <span className="number-font">{apt.startTime}-{apt.endTime}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[var(--color-text-secondary)]" />
                            <span className="text-sm font-medium">{apt.patientName}</span>
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)]">
                            {apt.chairName || `椅位${apt.chairId}`} · {typeLabel[apt.type] || apt.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-danger transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
      )}
    </div>
  )
}
