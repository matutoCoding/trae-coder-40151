import type { Request, Response } from 'express'
import * as patientRepo from '../repositories/patientRepository.js'

export function getPatients(req: Request, res: Response): void {
  try {
    const { search } = req.query
    let patients
    if (search) {
      patients = patientRepo.searchPatients(search as string)
    } else {
      patients = patientRepo.getAllPatients()
    }
    res.json({ success: true, data: patients })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function getPatientById(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '患者ID为必填项' })
      return
    }
    const patient = patientRepo.getPatientById(id)
    if (!patient) {
      res.status(404).json({ success: false, error: '患者不存在' })
      return
    }
    res.json({ success: true, data: patient })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function getPatientHistory(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id)
    if (!id) {
      res.status(400).json({ success: false, error: '患者ID为必填项' })
      return
    }
    const patient = patientRepo.getPatientById(id)
    if (!patient) {
      res.status(404).json({ success: false, error: '患者不存在' })
      return
    }
    const appointments = patientRepo.getPatientAppointments(id)
    const queueEntries = patientRepo.getPatientQueueEntries(id)
    res.json({ success: true, data: { patient, appointments, queueEntries } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}

export function findPatientByPhone(req: Request, res: Response): void {
  try {
    const { phone } = req.query
    if (!phone) {
      res.status(400).json({ success: false, error: '手机号为必填项' })
      return
    }
    const patient = patientRepo.findPatientByPhone(phone as string)
    if (!patient) {
      res.status(404).json({ success: false, error: '患者不存在' })
      return
    }
    const appointments = patientRepo.getPatientAppointments(patient.id).slice(0, 10)
    res.json({ success: true, data: { patient, recentAppointments: appointments } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
}
