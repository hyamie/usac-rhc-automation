'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EnrichmentButton } from './EnrichmentButton'
import { ConsultantBadge } from './ConsultantBadge'
import { FundingHistory } from './FundingHistory'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database.types'
import { MapPin, Calendar, DollarSign, Building2, FileText, Tag, X } from 'lucide-react'
import { useState } from 'react'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface ClinicCardProps {
  clinic: Clinic
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  const [isTagging, setIsTagging] = useState(false)
  const [showFunding, setShowFunding] = useState(false)

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

  const handleTagConsultant = async () => {
    setIsTagging(true)
    try {
      const response = await fetch(`/api/clinics/${clinic.id}/tag-consultant`, {
        method: 'POST',
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to tag consultant:', error)
    } finally {
      setIsTagging(false)
    }
  }

  const handleUntagConsultant = async () => {
    setIsTagging(true)
    try {
      const response = await fetch(`/api/clinics/${clinic.id}/untag-consultant`, {
        method: 'POST',
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to untag consultant:', error)
    } finally {
      setIsTagging(false)
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
            {clinic.program_type && (
              <Badge variant="outline">{clinic.program_type}</Badge>
            )}
            {clinic.processed && (
              <Badge variant="success">Processed</Badge>
            )}
          </div>
        </div>
        <div className="mt-3">
          <ConsultantBadge
            isConsultant={clinic.is_consultant || false}
            consultantCompany={clinic.consultant_company}
            consultantEmailDomain={clinic.consultant_email_domain}
            detectionMethod={clinic.consultant_detection_method}
            size="md"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {clinic.city}, {clinic.state}
          </span>
        </div>

        {clinic.posting_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Posted: {formatDate(clinic.posting_date)}</span>
          </div>
        )}

        {clinic.form_465_pdf_url && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-blue-600" />
            <a
              href={clinic.form_465_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Form 465 PDF
            </a>
          </div>
        )}

        {(clinic.funding_year_1 || clinic.funding_year_2 || clinic.funding_year_3) && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFunding(!showFunding)}
              className="w-full mb-2"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {showFunding ? 'Hide' : 'Show'} Funding History
            </Button>
            {showFunding && (
              <FundingHistory
                fundingYear1={clinic.funding_year_1}
                fundingAmount1={clinic.funding_amount_1}
                fundingYear2={clinic.funding_year_2}
                fundingAmount2={clinic.funding_amount_2}
                fundingYear3={clinic.funding_year_3}
                fundingAmount3={clinic.funding_amount_3}
                totalFunding3y={clinic.total_funding_3y}
                layout="vertical"
              />
            )}
          </div>
        )}

        {(clinic.contact_name || clinic.mail_contact_name) && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium">Contact:</p>
            <p className="text-sm text-muted-foreground">
              {clinic.contact_name || clinic.mail_contact_name}
            </p>
            {(clinic.contact_email || clinic.mail_contact_email) && (
              <p className="text-sm text-muted-foreground">
                {clinic.contact_email || clinic.mail_contact_email}
              </p>
            )}
            {clinic.is_consultant && clinic.consultant_company && (
              <p className="text-xs text-purple-600 mt-1">
                via {clinic.consultant_company}
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
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
        </div>
        <div className="flex gap-2 w-full">
          {clinic.is_consultant ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUntagConsultant}
              disabled={isTagging}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Untag Consultant
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTagConsultant}
              disabled={isTagging}
              className="flex-1"
            >
              <Tag className="h-4 w-4 mr-2" />
              Tag as Consultant
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
