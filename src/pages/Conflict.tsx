import { useEffect, useState } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle2, Lightbulb, Search } from 'lucide-react'
import { useAppStore } from '@/store'
import type { ConflictDetail, TimeSlot } from '@/store'

export default function Conflict() {
  const { chairs, fetchChairs, checkConflict, getSuggestions } = useAppStore()
  const [form, setForm] = useState({
    chairId: 0,
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
  })
  const [duration, setDuration] = useState(60)
  const [conflictResult, setConflictResult] = useState<{
    hasConflict: boolean
    conflicts: ConflictDetail[]
    suggestions: TimeSlot[]
  } | null>(null)
  const [suggestions, setSuggestions] = useState<TimeSlot[]>([])
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetchChairs()
  }, [fetchChairs])

  const handleCheck = async () => {
    if (!form.chairId) return
    try {
      const result = await checkConflict(form.chairId, form.date, form.startTime, form.endTime)
      setConflictResult(result)
      setChecked(true)
    } catch {
      setConflictResult(null)
    }
  }

  const handleSuggest = async () => {
    if (!form.chairId) return
    try {
      const result = await getSuggestions(form.chairId, form.date, duration)
      setSuggestions(result)
    } catch {
      setSuggestions([])
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-[var(--color-text)]">冲突校验</h2>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">预约冲突检测</h3>
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">椅位</label>
          <select
            value={form.chairId}
            onChange={(e) => setForm({ ...form, chairId: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value={0}>请选择椅位</option>
            {chairs.map((c) => (
              <option key={c.id} value={c.id}>{c.name} - {c.location}</option>
            ))}
          </select>
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
        <button
          onClick={handleCheck}
          className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          检测冲突
        </button>
      </div>

      {checked && conflictResult && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up">
          {conflictResult.hasConflict ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <h3 className="font-semibold text-danger">检测到冲突</h3>
              </div>
              <div className="space-y-2">
                {conflictResult.conflicts.map((c, i) => (
                  <div key={i} className="py-2 px-3 rounded-lg bg-danger-50 border border-danger/20">
                    <div className="text-sm font-medium">{c.patientName}</div>
                    <div className="number-font text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {c.startTime} - {c.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="font-medium text-success">该时段无冲突，可以预约</span>
            </div>
          )}
          {conflictResult.suggestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">推荐时段</span>
              </div>
              <div className="space-y-1.5">
                {conflictResult.suggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-primary-50">
                    <span className="number-font text-sm text-primary">{s.startTime} - {s.endTime}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{s.chairName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">智能推荐时段</h3>
        <div>
          <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">椅位</label>
          <select
            value={form.chairId}
            onChange={(e) => setForm({ ...form, chairId: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value={0}>请选择椅位</option>
            {chairs.map((c) => (
              <option key={c.id} value={c.id}>{c.name} - {c.location}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">日期</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">时长(分钟)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              min={15}
              step={15}
            />
          </div>
        </div>
        <button
          onClick={handleSuggest}
          className="w-full py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-light transition-colors flex items-center justify-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          查找可用时段
        </button>

        {suggestions.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-[var(--color-border)] hover:shadow-sm transition-all">
                <span className="number-font text-sm font-medium text-primary">{s.startTime} - {s.endTime}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{s.chairName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
