import { useEffect } from 'react'
import { LayoutDashboard, Users, Armchair, Clock, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store'

export default function Dashboard() {
  const { queue, servingList, chairs, fetchQueue, fetchServingList, fetchChairs } = useAppStore()

  useEffect(() => {
    fetchQueue()
    fetchServingList()
    fetchChairs()
  }, [fetchQueue, fetchServingList, fetchChairs])

  const waitingCount = queue.filter((q) => q.status === 'waiting').length
  const servingCount = servingList.length
  const availableChairs = chairs.filter((c) => c.status === 'available').length
  const emergencyCount = queue.filter((q) => q.type === 'emergency' && q.status === 'waiting').length

  const stats = [
    { label: '等待中', value: waitingCount, icon: Clock, color: 'bg-primary-50 text-primary' },
    { label: '就诊中', value: servingCount, icon: Users, color: 'bg-success-50 text-success' },
    { label: '空闲椅位', value: availableChairs, icon: Armchair, color: 'bg-primary-50 text-primary' },
    { label: '急诊等待', value: emergencyCount, icon: AlertTriangle, color: 'bg-danger-50 text-danger' },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-[var(--color-text)]">仪表盘</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="number-font text-3xl font-bold text-[var(--color-text)]">{stat.value}</div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-[var(--color-text)] mb-3">椅位状态</h3>
        <div className="space-y-2">
          {chairs.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">暂无椅位数据</p>
          )}
          {chairs.map((chair) => (
            <div
              key={chair.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Armchair className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium">{chair.name}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{chair.location}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  chair.status === 'available'
                    ? 'bg-success-50 text-success'
                    : chair.status === 'occupied'
                      ? 'bg-primary-50 text-primary'
                      : 'bg-warning-50 text-warning'
                }`}
              >
                {chair.status === 'available' ? '空闲' : chair.status === 'occupied' ? '占用' : '维护'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-[var(--color-text)] mb-3">当前就诊</h3>
        <div className="space-y-2">
          {servingList.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">暂无就诊中的患者</p>
          )}
          {servingList.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="number-font text-sm font-bold text-primary">{entry.queueNumber}</span>
                <span className="text-sm">{entry.patientName}</span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {entry.chairName || `椅位${entry.chairId}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
