import { useEffect, useState } from 'react'
import { Crown, Star, AlertTriangle, User, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/store'

const typeConfig = {
  normal: { label: '普通', icon: User, color: 'bg-gray-100 text-gray-500', badge: 'bg-gray-500 text-white' },
  vip: { label: 'VIP', icon: Star, color: 'bg-warning-50 text-warning', badge: 'bg-warning text-white' },
  emergency: { label: '急诊', icon: AlertTriangle, color: 'bg-danger-50 text-danger', badge: 'bg-danger text-white' },
}

export default function Priority() {
  const { queue, fetchQueue, promoteEntry } = useAppStore()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const waitingList = queue.filter((q) => q.status === 'waiting')

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const handlePromoteToVip = async (id: number) => {
    await promoteEntry(id, 'vip')
    showToast('已提升为VIP')
  }

  const handlePromoteToEmergency = async (id: number) => {
    await promoteEntry(id, 'emergency')
    showToast('已提升为急诊')
  }

  const handlePromotePosition = async (id: number, type: string) => {
    promoteEntry(id, type)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-success text-white rounded-lg shadow-lg text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Crown className="w-6 h-6 text-warning" />
        <h2 className="text-xl font-bold text-[var(--color-text)]">优先队列</h2>
      </div>

      {waitingList.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Crown className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[var(--color-text-secondary)]">暂无等待患者</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitingList.map((entry, index) => {
            const config = typeConfig[entry.type as keyof typeof typeConfig] || typeConfig.normal
            const Icon = config.icon

            return (
              <div
                key={entry.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.color} mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="number-font text-sm font-bold text-primary">{entry.queueNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{entry.patientName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {entry.patientPhone}
                      </p>
                      {entry.waitMinutes != null && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          已等待 {entry.waitMinutes} 分钟
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="number-font text-2xl font-bold text-[var(--color-text)]">
                      #{index + 1}
                    </span>
                    {entry.type === 'normal' ? (
                      <div className="flex gap-1">
                      <button
                        onClick={() => handlePromoteToVip(entry.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-warning-50 text-warning rounded-md hover:bg-warning-100 transition-colors font-medium"
                      >
                        <Star className="w-3 h-3" />
                        VIP
                      </button>
                      <button
                        onClick={() => handlePromoteToEmergency(entry.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-danger-50 text-danger rounded-md hover:bg-danger-100 transition-colors font-medium"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        急诊
                      </button>
                    </div>
                    ) : index > 0 && (
                      <button
                        onClick={() => handlePromotePosition(entry.id, entry.type)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-primary-50 text-primary rounded-md hover:bg-primary-100 transition-colors font-medium"
                      >
                        <TrendingUp className="w-3 h-3" />
                        提升
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
