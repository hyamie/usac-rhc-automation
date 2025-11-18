'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/utils'
import { Loader2, CheckCircle2, MapPin, DollarSign, Building2 } from 'lucide-react'
import { useClinicSelection } from '@/contexts/ClinicSelectionContext'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'
import type { AggregatedClinic } from '@/lib/clinic-aggregation'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedClinics: (Clinic | AggregatedClinic)[]
  totalFunding: number
}

export function CreateGroupModal({
  open,
  onOpenChange,
  selectedClinics,
  totalFunding,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('')
  const [primaryClinicId, setPrimaryClinicId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const { clearSelection } = useClinicSelection()

  // Set default group name based on first clinic
  const suggestedName = selectedClinics.length > 0
    ? `${selectedClinics[0].clinic_name} Group`
    : ''

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }

    if (!primaryClinicId) {
      toast.error('Please select a primary clinic for contact information')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/clinic-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_name: groupName,
          primary_clinic_id: primaryClinicId,
          clinic_ids: selectedClinics.map(c => c.id),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create group')
      }

      const result = await response.json()

      toast.success('Group Created!', {
        description: `${groupName} with ${selectedClinics.length} clinics`,
      })

      // Clear selection and close modal
      clearSelection()
      setGroupName('')
      setPrimaryClinicId('')
      onOpenChange(false)

      // Refresh the page to show new grouped card
      window.location.reload()
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getClinicFunding = (clinic: Clinic | AggregatedClinic): number => {
    if ('total_funding' in clinic && typeof clinic.total_funding === 'number') {
      return clinic.total_funding
    }
    if (clinic.historical_funding) {
      try {
        const funding = clinic.historical_funding as Array<{ year: string; amount: number }>
        return funding.reduce((sum, item) => sum + (item.amount || 0), 0)
      } catch {
        return 0
      }
    }
    return 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Clinic Group</DialogTitle>
          <DialogDescription>
            Combine multiple clinic locations under one grouped card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name Input */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder={suggestedName || 'Enter group name...'}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Primary Clinic Selection */}
          <div className="space-y-2">
            <Label htmlFor="primary-clinic">
              Primary Contact Clinic
              <span className="ml-1 text-sm text-muted-foreground">
                (Used for contact information)
              </span>
            </Label>
            <select
              id="primary-clinic"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={primaryClinicId}
              onChange={(e) => setPrimaryClinicId(e.target.value)}
            >
              <option value="">Select primary clinic...</option>
              {selectedClinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.clinic_name} - {clinic.city}, {clinic.state}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Clinics List */}
          <div className="space-y-2">
            <Label>Selected Clinics ({selectedClinics.length})</Label>
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="space-y-2 p-4">
                {selectedClinics.map((clinic) => {
                  const clinicFunding = getClinicFunding(clinic)
                  const isPrimary = clinic.id === primaryClinicId

                  return (
                    <div
                      key={clinic.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isPrimary
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{clinic.clinic_name}</p>
                            {isPrimary && (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Primary
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {clinic.city}, {clinic.state}
                            </span>
                            <span>HCP {clinic.hcp_number}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(clinicFunding)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Group Funding
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalFunding)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Locations
                </p>
                <p className="text-2xl font-bold">{selectedClinics.length}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || !primaryClinicId}
            className="gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
