'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { Database } from '@/types/database.types'
import type { AggregatedClinic } from '@/lib/clinic-aggregation'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface ClinicSelectionContextType {
  selectedClinics: Set<string>
  selectClinic: (clinicId: string) => void
  deselectClinic: (clinicId: string) => void
  toggleClinic: (clinicId: string) => void
  clearSelection: () => void
  isSelected: (clinicId: string) => boolean
  selectionCount: number
  getSelectedClinics: (clinics: (Clinic | AggregatedClinic)[]) => (Clinic | AggregatedClinic)[]
}

const ClinicSelectionContext = createContext<ClinicSelectionContextType | undefined>(undefined)

export function ClinicSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedClinics, setSelectedClinics] = useState<Set<string>>(new Set())

  const selectClinic = useCallback((clinicId: string) => {
    setSelectedClinics(prev => new Set(prev).add(clinicId))
  }, [])

  const deselectClinic = useCallback((clinicId: string) => {
    setSelectedClinics(prev => {
      const next = new Set(prev)
      next.delete(clinicId)
      return next
    })
  }, [])

  const toggleClinic = useCallback((clinicId: string) => {
    setSelectedClinics(prev => {
      const next = new Set(prev)
      if (next.has(clinicId)) {
        next.delete(clinicId)
      } else {
        next.add(clinicId)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedClinics(new Set())
  }, [])

  const isSelected = useCallback((clinicId: string) => {
    return selectedClinics.has(clinicId)
  }, [selectedClinics])

  const getSelectedClinics = useCallback((clinics: (Clinic | AggregatedClinic)[]) => {
    return clinics.filter(clinic => selectedClinics.has(clinic.id))
  }, [selectedClinics])

  const value: ClinicSelectionContextType = {
    selectedClinics,
    selectClinic,
    deselectClinic,
    toggleClinic,
    clearSelection,
    isSelected,
    selectionCount: selectedClinics.size,
    getSelectedClinics,
  }

  return (
    <ClinicSelectionContext.Provider value={value}>
      {children}
    </ClinicSelectionContext.Provider>
  )
}

export function useClinicSelection() {
  const context = useContext(ClinicSelectionContext)
  if (!context) {
    throw new Error('useClinicSelection must be used within ClinicSelectionProvider')
  }
  return context
}
