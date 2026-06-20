import * as chairRepo from '../repositories/chairRepository.js'

export function getChairs() {
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
