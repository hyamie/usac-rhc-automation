'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FundingHistory } from './FundingHistory'
import { NotesModal } from './NotesModal'
import { OutreachButton } from '@/components/OutreachButton'
import { OutreachStatus } from '@/components/OutreachStatus'
import { formatDate, formatCurrency } from '@/lib/utils'
import { highlightSearchTerm } from '@/lib/search-highlight'
import { useClinicSelection } from '@/contexts/ClinicSelectionContext'
import type { Database, HistoricalFundingItem, NoteItem } from '@/types/database.types'
import type { AggregatedClinic } from '@/lib/clinic-aggregation'
import { MapPin, Calendar, DollarSign, FileText, Mail, Phone, User, Building2, Send, Tag, CheckCircle2, FileEdit } from 'lucide-react'
import { useState } from 'react'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface ClinicCardProps {
  clinic: Clinic | AggregatedClinic
  onUpdate?: () => void
  searchTerm?: string
}

export function ClinicCard({ clinic, onUpdate, searchTerm = '' }: ClinicCardProps) {
  const [showFunding, setShowFunding] = useState(false)
  const [showContacts, setShowContacts] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showOutreach, setShowOutreach] = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  const [isTogglingPrimaryConsultant, setIsTogglingPrimaryConsultant] = useState(false)
  const [isTogglingMailConsultant, setIsTogglingMailConsultant] = useState(false)

  // Selection state
  const { isSelected, toggleClinic } = useClinicSelection()
  const selected = isSelected(clinic.id)

  // Check if this is an aggregated clinic
  const isAggregated = 'application_count' in clinic && clinic.application_count > 1
  const aggregatedClinic = isAggregated ? (clinic as AggregatedClinic) : null

  // Parse historical funding JSONB
  const historicalFunding = clinic.historical_funding as HistoricalFundingItem[] | null

  // Parse notes JSONB
  const notes = (clinic.notes as NoteItem[] | null) || []
  const notesCount = notes.length

  // Get primary contact email for outreach
  const contactEmail = clinic.contact_email || clinic.mail_contact_email || undefined

  // Handle Toggle Primary Contact Consultant
  const handleTogglePrimaryConsultant = async () => {
    setIsTogglingPrimaryConsultant(true)
    try {
      const response = await fetch(`/api/clinics/${clinic.id}/tag-primary-consultant`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle consultant tag')
      }

      const result = await response.json()
      console.log('Primary consultant toggled:', result)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error toggling primary consultant:', error)
      alert('Failed to update consultant tag. Please try again.')
    } finally {
      setIsTogglingPrimaryConsultant(false)
    }
  }

  // Handle Toggle Mail Contact Consultant
  const handleToggleMailConsultant = async () => {
    setIsTogglingMailConsultant(true)
    try {
      const response = await fetch(`/api/clinics/${clinic.id}/tag-mail-consultant`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle consultant tag')
      }

      const result = await response.json()
      console.log('Mail consultant toggled:', result)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error toggling mail consultant:', error)
      alert('Failed to update consultant tag. Please try again.')
    } finally {
      setIsTogglingMailConsultant(false)
    }
  }

  // Determine status color for left border
  const getStatusColor = () => {
    if (clinic.processed) return 'border-l-green-500'
    if (clinic.outreach_status && clinic.outreach_status !== 'pending') return 'border-l-orange-500'
    if (notesCount > 0) return 'border-l-blue-500'
    return 'border-l-gray-300'
  }

  return (
    <Card className={`
      hover:shadow-xl hover:-translate-y-1 transition-all duration-200
      border-l-4 ${getStatusColor()} ${selected ? 'ring-2 ring-primary shadow-lg' : ''}
      group cursor-pointer relative
    `}>
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={() => toggleClinic(clinic.id)}
          className="h-5 w-5 border-2"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <CardHeader className="pb-4 pl-12">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
              {highlightSearchTerm(clinic.clinic_name, searchTerm)}
            </CardTitle>
            <CardDescription className="mt-1">
              HCP #{clinic.hcp_number}
              {isAggregated ? (
                <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {aggregatedClinic?.application_count} Applications
                </span>
              ) : clinic.application_number && (
                <span className="ml-2 text-xs">
                  App: {clinic.application_number}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {clinic.funding_year && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800">
                FY {clinic.funding_year}
              </Badge>
            )}
            {clinic.request_for_services && (
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800">
                {clinic.request_for_services}
              </Badge>
            )}
            {clinic.processed && (
              <Badge variant="default" className="bg-green-600 dark:bg-green-700">
                Processed
              </Badge>
            )}
            {clinic.outreach_status && clinic.outreach_status !== 'pending' && (
              <Badge variant="default" className="bg-orange-600 dark:bg-orange-700">
                <Send className="h-3 w-3 mr-1" />
                {clinic.outreach_status === 'ready_for_outreach' && 'Ready'}
                {clinic.outreach_status === 'outreach_sent' && 'Sent'}
                {clinic.outreach_status === 'follow_up' && 'Follow-up'}
                {clinic.outreach_status === 'completed' && 'Complete'}
              </Badge>
            )}
          </div>
        </div>

        {/* Outreach Actions */}
        <div className="mt-3 space-y-2">
          <OutreachButton
            clinicId={clinic.id}
            clinicName={clinic.clinic_name}
            contactEmail={contactEmail}
            onSuccess={onUpdate}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOutreach(!showOutreach)}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {showOutreach ? 'Hide' : 'Show'} Outreach History
          </Button>
          {showOutreach && (
            <OutreachStatus clinicId={clinic.id} />
          )}
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

        {/* Multiple Locations Button (for aggregated clinics) */}
        {isAggregated && aggregatedClinic && aggregatedClinic.locations.length > 1 && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocations(!showLocations)}
              className="w-full mb-2"
            >
              <Building2 className="h-4 w-4 mr-2" />
              {showLocations ? 'Hide' : 'Show'} All Locations ({aggregatedClinic.locations.length})
            </Button>
            {showLocations && (
              <div className="space-y-2">
                {aggregatedClinic.locations.map((location, index) => (
                  <div
                    key={`${location.application_number}-${index}`}
                    className="bg-muted/50 rounded-lg p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="font-medium">
                        {location.address}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-5">
                      {location.city}, {location.state} {location.zip}
                    </div>
                    {location.application_number && (
                      <div className="text-xs text-muted-foreground pl-5">
                        App: {location.application_number}
                      </div>
                    )}
                    {location.filing_date && (
                      <div className="text-xs text-muted-foreground pl-5">
                        Filed: {formatDate(location.filing_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Service Type - Now with Modal */}
        {clinic.service_type && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-2" />
                View Requested Services
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Requested Services</DialogTitle>
                <DialogDescription>
                  Service details from Form 465 for {clinic.clinic_name}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 whitespace-pre-wrap text-sm">
                {clinic.service_type}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Historical Funding */}
        {isAggregated && aggregatedClinic ? (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFunding(!showFunding)}
              className="w-full mb-2"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {showFunding ? 'Hide' : 'Show'} Total Funding: {formatCurrency(aggregatedClinic.total_funding)}
            </Button>
            {showFunding && (
              <div className="space-y-2 text-sm">
                {Object.entries(aggregatedClinic.aggregated_funding)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([year, amount]) => (
                    <div key={year} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="font-medium">FY {year}</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : historicalFunding && Array.isArray(historicalFunding) && historicalFunding.length > 0 && (
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
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600">Primary Contact</p>
                      {clinic.contact_is_consultant && (
                        <Badge variant="default" className="bg-purple-600 text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          Consultant
                        </Badge>
                      )}
                    </div>
                    {clinic.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${clinic.contact_email}`} className="hover:underline">
                          {clinic.contact_email}
                        </a>
                      </div>
                    )}
                    {clinic.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${clinic.contact_phone}`} className="hover:underline">
                          {clinic.contact_phone}
                        </a>
                      </div>
                    )}
                    <Button
                      variant={clinic.contact_is_consultant ? 'outline' : 'default'}
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleTogglePrimaryConsultant}
                      disabled={isTogglingPrimaryConsultant}
                    >
                      <Tag className="h-3 w-3 mr-2" />
                      {isTogglingPrimaryConsultant
                        ? 'Updating...'
                        : clinic.contact_is_consultant
                        ? 'Remove Consultant Tag'
                        : 'Tag as Consultant'}
                    </Button>
                  </div>
                )}

                {/* Mail Contact */}
                {(clinic.mail_contact_first_name || clinic.mail_contact_email || clinic.mail_contact_phone) && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-blue-600">Mailing Contact</p>
                      {clinic.mail_contact_is_consultant && (
                        <Badge variant="default" className="bg-purple-600 text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          Consultant
                        </Badge>
                      )}
                    </div>
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${clinic.mail_contact_phone}`} className="hover:underline">
                          {clinic.mail_contact_phone}
                        </a>
                      </div>
                    )}
                    <Button
                      variant={clinic.mail_contact_is_consultant ? 'outline' : 'default'}
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleToggleMailConsultant}
                      disabled={isTogglingMailConsultant}
                    >
                      <Tag className="h-3 w-3 mr-2" />
                      {isTogglingMailConsultant
                        ? 'Updating...'
                        : clinic.mail_contact_is_consultant
                        ? 'Remove Consultant Tag'
                        : 'Tag as Consultant'}
                    </Button>
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
        </div>

        {/* Notes Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowNotes(true)}
        >
          <FileEdit className="h-4 w-4 mr-2" />
          {notesCount > 0 ? `Notes (${notesCount})` : 'Notes'}
        </Button>
      </CardFooter>

      {/* Notes Modal */}
      <NotesModal
        clinicId={clinic.id}
        clinicName={clinic.clinic_name}
        notes={notes}
        open={showNotes}
        onOpenChange={setShowNotes}
        onUpdate={onUpdate}
      />
    </Card>
  )
}
