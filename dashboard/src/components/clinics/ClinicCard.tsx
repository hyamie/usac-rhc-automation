'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EnrichmentButton } from './EnrichmentButton'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database.types'
import { MapPin, Calendar, DollarSign, Building2 } from 'lucide-react'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface ClinicCardProps {
  clinic: Clinic
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  const getPriorityVariant = (priority: string | null) => {
    switch (priority) {
      case 'High':
        return 'destructive'
      case 'Medium':
        return 'warning'
      case 'Low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{clinic.clinic_name}</CardTitle>
            <CardDescription className="mt-1">
              HCP #{clinic.hcp_number}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {clinic.priority_label && (
              <Badge variant={getPriorityVariant(clinic.priority_label)}>
                {clinic.priority_label}
              </Badge>
            )}
            {clinic.processed && (
              <Badge variant="success">Processed</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {clinic.city}, {clinic.state}
          </span>
        </div>

        {clinic.filing_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Filed: {formatDate(clinic.filing_date)}</span>
          </div>
        )}

        {clinic.total_funding_3y && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>3Y Funding: {formatCurrency(clinic.total_funding_3y)}</span>
          </div>
        )}

        {clinic.location_count && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{clinic.location_count} location{clinic.location_count > 1 ? 's' : ''}</span>
          </div>
        )}

        {clinic.enriched && clinic.contact_name && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium">Contact:</p>
            <p className="text-sm text-muted-foreground">{clinic.contact_name}</p>
            {clinic.contact_email && (
              <p className="text-sm text-muted-foreground">{clinic.contact_email}</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {clinic.enriched ? (
            <span>Enriched {clinic.enrichment_date && `on ${formatDate(clinic.enrichment_date)}`}</span>
          ) : (
            <span>Not enriched yet</span>
          )}
        </div>
        <EnrichmentButton
          clinicId={clinic.id}
          hcpNumber={clinic.hcp_number}
          clinicName={clinic.clinic_name}
          enriched={clinic.enriched}
        />
      </CardFooter>
    </Card>
  )
}
