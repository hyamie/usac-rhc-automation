'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FundingHistory } from './FundingHistory'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Database, HistoricalFundingItem } from '@/types/database.types'
import { MapPin, Calendar, DollarSign, FileText, Mail, Phone, User, Building2 } from 'lucide-react'
import { useState } from 'react'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface ClinicCardProps {
  clinic: Clinic
}

export function ClinicCard({ clinic }: ClinicCardProps) {
  const [showFunding, setShowFunding] = useState(false)
  const [showContacts, setShowContacts] = useState(false)

  // Parse historical funding JSONB
  const historicalFunding = clinic.historical_funding as HistoricalFundingItem[] | null

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{clinic.clinic_name}</CardTitle>
            <CardDescription className="mt-1">
              HCP #{clinic.hcp_number}
              {clinic.application_number && (
                <span className="ml-2 text-xs">
                  App: {clinic.application_number}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {clinic.funding_year && (
              <Badge variant="outline" className="bg-blue-50">
                FY {clinic.funding_year}
              </Badge>
            )}
            {clinic.application_type && (
              <Badge variant="outline" className="bg-purple-50">
                {clinic.application_type}
              </Badge>
            )}
            {clinic.processed && (
              <Badge variant="default" className="bg-green-600">
                Processed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {clinic.city}, {clinic.state} {clinic.zip}
          </span>
        </div>

        {/* Filing Date */}
        {clinic.filing_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Filed: {formatDate(clinic.filing_date)}</span>
          </div>
        )}

        {/* Allowable Contract Start Date */}
        {clinic.allowable_contract_start_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Contract Start: {formatDate(clinic.allowable_contract_start_date)}</span>
          </div>
        )}

        {/* Form 465 PDF Link */}
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

        {/* Service Type */}
        {clinic.service_type && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="line-clamp-2">{clinic.service_type}</span>
          </div>
        )}

        {/* Historical Funding */}
        {historicalFunding && Array.isArray(historicalFunding) && historicalFunding.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFunding(!showFunding)}
              className="w-full mb-2"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {showFunding ? 'Hide' : 'Show'} Funding History ({historicalFunding.length} years)
            </Button>
            {showFunding && (
              <FundingHistory
                historicalFunding={historicalFunding}
                layout="vertical"
              />
            )}
          </div>
        )}

        {/* Contact Information */}
        {(clinic.contact_email || clinic.contact_phone ||
          clinic.mail_contact_first_name || clinic.mail_contact_email) && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContacts(!showContacts)}
              className="w-full mb-2"
            >
              <User className="h-4 w-4 mr-2" />
              {showContacts ? 'Hide' : 'Show'} Contact Information
            </Button>

            {showContacts && (
              <div className="space-y-3">
                {/* Primary Contact */}
                {(clinic.contact_email || clinic.contact_phone) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Primary Contact</p>
                    {clinic.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${clinic.contact_email}`} className="hover:underline">
                          {clinic.contact_email}
                        </a>
                      </div>
                    )}
                    {clinic.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${clinic.contact_phone}`} className="hover:underline">
                          {clinic.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Mail Contact */}
                {(clinic.mail_contact_first_name || clinic.mail_contact_email || clinic.mail_contact_phone) && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-600 mb-2">Mailing Contact</p>
                    {(clinic.mail_contact_first_name || clinic.mail_contact_last_name) && (
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {clinic.mail_contact_first_name} {clinic.mail_contact_last_name}
                      </p>
                    )}
                    {clinic.mail_contact_org_name && (
                      <p className="text-xs text-gray-600 mb-2">
                        {clinic.mail_contact_org_name}
                      </p>
                    )}
                    {clinic.mail_contact_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${clinic.mail_contact_email}`} className="hover:underline">
                          {clinic.mail_contact_email}
                        </a>
                      </div>
                    )}
                    {clinic.mail_contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${clinic.mail_contact_phone}`} className="hover:underline">
                          {clinic.mail_contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
          <span>Created: {formatDate(clinic.created_at)}</span>
          {clinic.notes && (
            <Badge variant="outline" className="text-xs">
              Has Notes
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
