import { useEffect, useState } from 'react'
import { Bell, UserPlus, PhoneCall, X, User, Plus } from 'lucide-react'
import { useAppStore } from '@/store'

export default function Queue() {
  const { queue, servingList, chairs, fetchQueue, fetchServingList, fetchChairs, takeNumber, callNext, callSpecific, completeService, cancelEntry } = useAppStore()
  const [showTakeNumber, setShowTakeNumber] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', type: 'normal' })

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

  const handleComplete = async (id: number) => {
    await completeService(id)
  }

  const handleCancel = async (id: number) => {
    await cancelEntry(id)
  }

  return (
    <div className="space-y-4 animate-fade-in">
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
            {waitingList.map((entry, index) => (
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
                  onClick={() => handleComplete(entry.id)}
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
