'use client'

import { useState } from 'react'
import { useClinics, type ClinicsFilters } from '@/hooks/use-clinics'
import { ClinicCard } from './ClinicCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function ClinicList() {
  const [filters, setFilters] = useState<ClinicsFilters>({})
  const { data: clinics, isLoading, error } = useClinics(filters)

  const handleFilterChange = (key: keyof ClinicsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
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
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Priority:</span>
          <div className="flex gap-1">
            <Button
              variant={filters.priority === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'all')}
            >
              All
            </Button>
            <Button
              variant={filters.priority === 'High' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'High')}
            >
              High
            </Button>
            <Button
              variant={filters.priority === 'Medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'Medium')}
            >
              Medium
            </Button>
            <Button
              variant={filters.priority === 'Low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('priority', 'Low')}
            >
              Low
            </Button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex gap-1">
            <Button
              variant={filters.enriched === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('enriched', 'all')}
            >
              All
            </Button>
            <Button
              variant={filters.enriched === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('enriched', false)}
            >
              Not Enriched
            </Button>
            <Button
              variant={filters.enriched === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('enriched', true)}
            >
              Enriched
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
            <ClinicCard key={clinic.id} clinic={clinic} />
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
