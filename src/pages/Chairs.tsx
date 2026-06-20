import { useEffect, useState } from 'react'
import { Settings, Plus, Edit2, Wrench, CheckCircle, Armchair, AlertTriangle, X } from 'lucide-react'
import { useAppStore, type DentalChair } from '@/store'
import { cn } from '@/lib/utils'

const statusConfig = {
  available: { label: '空闲', cls: 'bg-success-50 text-success', dot: 'bg-success' },
  occupied: { label: '使用中', cls: 'bg-primary-50 text-primary', dot: 'bg-primary' },
  maintenance: { label: '维护中', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
}

export default function Chairs() {
  const { chairs, fetchChairs, createChair, updateChair, updateChairStatus } = useAppStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingChair, setEditingChair] = useState<DentalChair | null>(null)
  const [addForm, setAddForm] = useState({ name: '', location: '' })
  const [editForm, setEditForm] = useState({ name: '', location: '' })
  const [toast, setToast] = useState<string | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<DentalChair | null>(null)

  useEffect(() => {
    fetchChairs()
  }, [fetchChairs])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const handleAddChair = async () => {
    if (!addForm.name) return
    await createChair(addForm.name, addForm.location)
    setAddForm({ name: '', location: '' })
    setShowAddForm(false)
    showToast('牙椅添加成功')
  }

  const handleEditChair = async () => {
    if (!editingChair || !editForm.name) return
    await updateChair(editingChair.id, editForm.name, editForm.location)
    setEditingChair(null)
    showToast('牙椅信息已更新')
  }

  const handleToggleStatus = (chair: DentalChair) => {
    if (chair.status === 'occupied') return
    setConfirmToggle(chair)
  }

  const handleConfirmToggle = async () => {
    if (!confirmToggle) return
    const newStatus = confirmToggle.status === 'available' ? 'maintenance' : 'available'
    await updateChairStatus(confirmToggle.id, newStatus)
    showToast(newStatus === 'maintenance' ? '已标记为维护中' : '已恢复可用')
    setConfirmToggle(null)
  }

  const startEditing = (chair: DentalChair) => {
    setEditingChair(chair)
    setEditForm({ name: chair.name, location: chair.location })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-success text-white rounded-lg shadow-lg text-sm font-medium animate-slide-up">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-[var(--color-text)]">牙椅管理</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增牙椅
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up space-y-3">
          <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Armchair className="w-4 h-4 text-primary" />
            新增牙椅
          </h3>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">牙椅名称</label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="例如：6号椅"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">位置</label>
            <input
              type="text"
              value={addForm.location}
              onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="例如：C区"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddChair}
              className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              确认添加
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setAddForm({ name: '', location: '' })
              }}
              className="flex-1 py-2 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {editingChair && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up space-y-3">
          <h3 className="font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-primary" />
            编辑牙椅
          </h3>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">牙椅名称</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">位置</label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleEditChair}
              className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              确认修改
            </button>
            <button
              onClick={() => setEditingChair(null)}
              className="flex-1 py-2 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {chairs.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Armchair className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-30" />
          <p className="text-sm text-[var(--color-text-secondary)]">暂无牙椅信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {chairs.map((chair) => {
            const config = statusConfig[chair.status]
            const isOccupied = chair.status === 'occupied'

            return (
              <div
                key={chair.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50">
                      <Armchair className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-text)]">{chair.name}</h3>
                      {chair.location && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {chair.location}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={cn('w-2 h-2 rounded-full', config.dot)} />
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', config.cls)}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOccupied ? (
                      <button
                        disabled
                        className="relative group px-3 py-1.5 text-xs bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                      >
                        <Wrench className="w-3.5 h-3.5 inline mr-1" />
                        标记维护
                        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          使用中无法修改状态
                        </div>
                      </button>
                    ) : chair.status === 'available' ? (
                      <button
                        onClick={() => handleToggleStatus(chair)}
                        className="px-3 py-1.5 text-xs bg-warning-50 text-warning rounded-lg hover:bg-warning-100 transition-colors font-medium"
                      >
                        <Wrench className="w-3.5 h-3.5 inline mr-1" />
                        标记维护
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(chair)}
                        className="px-3 py-1.5 text-xs bg-success-50 text-success rounded-lg hover:bg-success-100 transition-colors font-medium"
                      >
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                        恢复可用
                      </button>
                    )}
                    <button
                      onClick={() => startEditing(chair)}
                      className="p-1.5 text-[var(--color-text-secondary)] hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                confirmToggle.status === 'available' ? 'bg-warning-50' : 'bg-success-50'
              )}>
                {confirmToggle.status === 'available' ? (
                  <AlertTriangle className="w-5 h-5 text-warning" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                {confirmToggle.status === 'available' ? '标记维护中' : '恢复可用'}
              </h3>
            </div>
            {confirmToggle.status === 'available' ? (
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                确定将 <span className="font-medium text-[var(--color-text)]">{confirmToggle.name}</span> 标记为维护中？维护期间该牙椅将无法用于叫号和预约。
              </p>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                确定将 <span className="font-medium text-[var(--color-text)]">{confirmToggle.name}</span> 恢复为可用状态？
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={handleConfirmToggle}
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-medium transition-colors text-white',
                  confirmToggle.status === 'available'
                    ? 'bg-warning hover:bg-warning-light'
                    : 'bg-success hover:bg-success-light'
                )}
              >
                确认
              </button>
              <button
                onClick={() => setConfirmToggle(null)}
                className="w-full py-2.5 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
