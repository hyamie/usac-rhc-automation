'use client'

import { useState } from 'react'
import { useClinics, type ClinicsFilters } from '@/hooks/use-clinics'
import { ClinicCard } from './ClinicCard'
import { SingleDayPicker } from '@/components/filters/SingleDayPicker'
import { ConsultantFilter } from '@/components/filters/ConsultantFilter'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { startOfDay, addDays } from 'date-fns'

export function ClinicList() {
  const [filters, setFilters] = useState<ClinicsFilters>({})
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [consultantFilter, setConsultantFilter] = useState<'all' | 'direct' | 'consultant'>('all')

  const { data: clinics, isLoading, error, refetch } = useClinics(filters)

  const handleFilterChange = (key: keyof ClinicsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    const dateFrom = startOfDay(date).toISOString()
    const dateTo = addDays(startOfDay(date), 1).toISOString()
    setFilters((prev) => ({
      ...prev,
      dateFrom,
      dateTo,
    }))
  }

  const handleConsultantFilterChange = (value: 'all' | 'direct' | 'consultant') => {
    setConsultantFilter(value)
    setFilters((prev) => ({
      ...prev,
      isConsultant: value === 'all' ? undefined : value === 'consultant',
    }))
  }

  // Calculate counts for consultant filter (removed - consultant detection not in current schema)
  const consultantCounts = {
    all: clinics?.length || 0,
    direct: 0,
    consultant: 0,
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <h3 className="font-semibold text-destructive mb-2">Error Loading Clinics</h3>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Phase 2 Filters Row */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <SingleDayPicker
          value={selectedDate}
          onChange={handleDateChange}
        />
        <ConsultantFilter
          value={consultantFilter}
          onChange={handleConsultantFilterChange}
          counts={consultantCounts}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Funding Year:</span>
          <div className="flex gap-1">
            <Button
              variant={filters.funding_year === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('funding_year', 'all')}
            >
              All
            </Button>
            <Button
              variant={filters.funding_year === '2025' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('funding_year', '2025')}
            >
              2025
            </Button>
            <Button
              variant={filters.funding_year === '2026' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('funding_year', '2026')}
            >
              2026
            </Button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Processed:</span>
          <div className="flex gap-1">
            <Button
              variant={filters.processed === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('processed', 'all')}
            >
              All
            </Button>
            <Button
              variant={filters.processed === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('processed', false)}
            >
              Pending
            </Button>
            <Button
              variant={filters.processed === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('processed', true)}
            >
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clinics && clinics.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} onUpdate={() => refetch()} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No clinics found matching your filters.</p>
        </div>
      )}

      {clinics && clinics.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
