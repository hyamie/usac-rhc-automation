'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClinics, type ClinicsFilters } from '@/hooks/use-clinics'
import { ClinicCard } from './ClinicCard'
import { SingleDayPicker } from '@/components/filters/SingleDayPicker'
import { ConsultantFilter } from '@/components/filters/ConsultantFilter'
import { FundingYearFilter } from '@/components/filters/FundingYearFilter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'
import { startOfDay, addDays } from 'date-fns'

export function ClinicList() {
  const [filters, setFilters] = useState<ClinicsFilters>({})
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [consultantFilter, setConsultantFilter] = useState<'all' | 'direct' | 'consultant'>('all')
  const [fundingYear, setFundingYear] = useState<'all' | '2025' | '2026'>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [displayLimit, setDisplayLimit] = useState(50)
  const [showAll, setShowAll] = useState(false)

  const { data: clinics, isLoading, error, refetch } = useClinics(filters)

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: debouncedSearch || undefined,
    }))
  }, [debouncedSearch])

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(50)
    setShowAll(false)
  }, [filters])

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

  const handleFundingYearChange = (value: 'all' | '2025' | '2026') => {
    setFundingYear(value)
    setFilters((prev) => ({
      ...prev,
      funding_year: value === 'all' ? undefined : value,
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
      {/* Primary Filters Row - Funding Year, Contacts, Date */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg border">
        <FundingYearFilter
          value={fundingYear}
          onChange={handleFundingYearChange}
        />
        <ConsultantFilter
          value={consultantFilter}
          onChange={handleConsultantFilterChange}
          counts={consultantCounts}
        />
        <SingleDayPicker
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>

      {/* Secondary Filters Row - Status & Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Status:</span>
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
            <Button
              variant={filters.processed === 'has_notes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('processed', 'has_notes')}
            >
              Has Notes
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search all fields..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clinics && clinics.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(showAll ? clinics : clinics.slice(0, displayLimit)).map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} onUpdate={() => refetch()} />
            ))}
          </div>

          {/* Load More / Show All Controls */}
          {!showAll && clinics.length > displayLimit && (
            <div className="flex flex-col items-center gap-4 pt-6">
              <div className="text-sm text-muted-foreground">
                Showing {displayLimit} of {clinics.length} clinics
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDisplayLimit(prev => Math.min(prev + 50, clinics.length))}
                >
                  Load 50 More
                </Button>
                <Button
                  onClick={() => setShowAll(true)}
                >
                  Show All ({clinics.length})
                </Button>
              </div>
            </div>
          )}

          {showAll && clinics.length > 50 && (
            <div className="text-center pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAll(false)
                  setDisplayLimit(50)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Show Less
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No clinics found matching your filters.</p>
        </div>
      )}

      {clinics && clinics.length > 0 && showAll && (
        <div className="text-sm text-muted-foreground text-center">
          Showing all {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
