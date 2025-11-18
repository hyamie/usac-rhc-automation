'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useClinicSelection } from '@/contexts/ClinicSelectionContext'
import { formatCurrency } from '@/lib/utils'
import { FolderPlus, X, DollarSign } from 'lucide-react'
import { CreateGroupModal } from './CreateGroupModal'
import type { Database } from '@/types/database.types'
import type { AggregatedClinic } from '@/lib/clinic-aggregation'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface SelectionToolbarProps {
  clinics: (Clinic | AggregatedClinic)[]
}

export function SelectionToolbar({ clinics }: SelectionToolbarProps) {
  const { selectionCount, getSelectedClinics, clearSelection } = useClinicSelection()
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  if (selectionCount < 2) return null

  const selectedClinicsList = getSelectedClinics(clinics)

  // Calculate total funding from selected clinics
  const totalFunding = selectedClinicsList.reduce((sum, clinic) => {
    // Check if it's an aggregated clinic
    if ('total_funding' in clinic && typeof clinic.total_funding === 'number') {
      return sum + clinic.total_funding
    }
    // Otherwise, sum from historical_funding
    if (clinic.historical_funding) {
      try {
        const funding = clinic.historical_funding as Array<{ year: string; amount: number }>
        return sum + funding.reduce((yearSum, item) => yearSum + (item.amount || 0), 0)
      } catch (error) {
        console.error('Error parsing funding:', error)
        return sum
      }
    }
    return sum
  }, 0)

  return (
    <>
      <Card className="sticky top-16 z-10 mb-4 border-2 border-primary bg-primary/5 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Clinics Selected
              </p>
              <p className="text-2xl font-bold">{selectionCount}</p>
            </div>

            <div className="h-12 w-px bg-border" />

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Funding
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalFunding)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="gap-2"
              size="lg"
            >
              <FolderPlus className="h-5 w-5" />
              Group Selected Clinics
            </Button>

            <Button
              onClick={clearSelection}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <X className="h-5 w-5" />
              Clear Selection
            </Button>
          </div>
        </div>
      </Card>

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        selectedClinics={selectedClinicsList}
        totalFunding={totalFunding}
      />
    </>
  )
}
