'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClinics, type ClinicsFilters } from '@/hooks/use-clinics'
import { ClinicCard } from './ClinicCard'
import { ClinicCardSkeleton } from './ClinicCardSkeleton'
import { SingleDayPicker } from '@/components/filters/SingleDayPicker'
import { ConsultantFilter } from '@/components/filters/ConsultantFilter'
import { FundingYearFilter } from '@/components/filters/FundingYearFilter'
import { StateFilter } from '@/components/filters/StateFilter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Grid3x3, List, Columns2, FolderOpen, Map as MapIcon } from 'lucide-react'
import { startOfDay, addDays } from 'date-fns'
import dynamic from 'next/dynamic'

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import('./MapView').then(mod => mod.MapView),
  { ssr: false, loading: () => <div className="w-full h-[600px] rounded-lg border bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> }
)

type ViewMode = 'grid' | 'list' | 'compact' | 'map'

export function ClinicList() {
  const [filters, setFilters] = useState<ClinicsFilters>({})
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [consultantFilter, setConsultantFilter] = useState<'all' | 'direct' | 'consultant'>('all')
  const [fundingYear, setFundingYear] = useState<'all' | '2025' | '2026'>('all')
  const [stateFilter, setStateFilter] = useState<'all' | string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [displayLimit, setDisplayLimit] = useState(50)
  const [showAll, setShowAll] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

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

  const handleStateFilterChange = (value: 'all' | string) => {
    setStateFilter(value)
    setFilters((prev) => ({
      ...prev,
      state: value === 'all' ? undefined : value,
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
      {/* Primary Filters Row - Funding Year, State, Contacts, Date */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg border">
        <FundingYearFilter
          value={fundingYear}
          onChange={handleFundingYearChange}
        />
        <StateFilter
          value={stateFilter}
          onChange={handleStateFilterChange}
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
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
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

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-3"
            title="Grid View"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
            title="List View"
          >
            <Columns2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('compact')}
            className="h-8 px-3"
            title="Compact View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="h-8 px-3"
            title="Map View"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        viewMode === 'map' ? (
          <div className="w-full h-[600px] rounded-lg border bg-muted flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className={`
            grid gap-6
            ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}
            ${viewMode === 'list' ? 'md:grid-cols-2' : ''}
            ${viewMode === 'compact' ? 'grid-cols-1' : ''}
          `}>
            {[...Array(6)].map((_, i) => (
              <ClinicCardSkeleton key={i} />
            ))}
          </div>
        )
      ) : clinics && clinics.length > 0 ? (
        <>
          {viewMode === 'map' ? (
            <MapView clinics={clinics} />
          ) : (
            <div className={`
              grid gap-6
              ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}
              ${viewMode === 'list' ? 'md:grid-cols-2' : ''}
              ${viewMode === 'compact' ? 'grid-cols-1' : ''}
            `}>
              {(showAll ? clinics : clinics.slice(0, displayLimit)).map((clinic, index) => (
                <div
                  key={clinic.id}
                  className={`animate-fadeInUp opacity-0`}
                  style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                >
                  <ClinicCard
                    clinic={clinic}
                    onUpdate={() => refetch()}
                    searchTerm={debouncedSearch}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Load More / Show All Controls (hide in map view) */}
          {viewMode !== 'map' && !showAll && clinics.length > displayLimit && (
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

          {viewMode !== 'map' && showAll && clinics.length > 50 && (
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
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="rounded-full bg-muted p-6 mb-6">
            <FolderOpen className="h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">No Clinics Found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            No clinics match your current filters. Try adjusting your search criteria or clearing some filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({})
              setSearchInput('')
              setFundingYear('all')
              setStateFilter('all')
              setConsultantFilter('all')
            }}
          >
            Clear All Filters
          </Button>
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
