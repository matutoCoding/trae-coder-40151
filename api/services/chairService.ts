import * as chairRepo from '../repositories/chairRepository.js'

export function getChairs(status?: string) {
  if (status) {
    const statuses = status.split(',').map(s => s.trim())
    const validStatuses = ['available', 'occupied', 'maintenance']
    const filtered = statuses.filter(s => validStatuses.includes(s))
    if (filtered.length > 0) {
      return chairRepo.getChairsByStatus(filtered)
    }
  }
  return chairRepo.getAllChairs()
}

export function createChair(name: string, location: string = '') {
  const existing = chairRepo.getAllChairs().find(c => c.name === name)
  if (existing) throw new Error('椅位名称已存在')
  return chairRepo.createChair(name, location)
}

export function updateChairStatus(id: number, status: string) {
  const chair = chairRepo.getChairById(id)
  if (!chair) throw new Error('椅位不存在')
  if (!['available', 'occupied', 'maintenance'].includes(status)) {
    throw new Error('无效的椅位状态')
  }
  return chairRepo.updateChairStatus(id, status)
}

export function updateChair(id: number, name: string, location: string) {
  const chair = chairRepo.getChairById(id)
  if (!chair) throw new Error('椅位不存在')
  if (!name) throw new Error('椅位名称为必填项')
  const existing = chairRepo.getAllChairs().find(c => c.name === name && c.id !== id)
  if (existing) throw new Error('椅位名称已存在')
  return chairRepo.updateChair(id, name, location)
}
