import type { Database } from '@/types/database.types'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

export interface HistoricalFundingItem {
  year: string
  amount: number
}

export interface AggregatedFunding {
  [year: string]: number
}

export interface LocationInfo {
  address: string
  city: string
  state: string
  zip: string
  application_number?: string
  filing_date?: string
}

export interface AggregatedClinic extends Omit<Clinic, 'id' | 'application_number'> {
  hcp_number: string
  clinic_name: string
  application_count: number
  application_numbers: string[]
  aggregated_funding: AggregatedFunding
  total_funding: number
  locations: LocationInfo[]
  // Keep other fields from first clinic
}

/**
 * Aggregates multiple clinic applications under the same HCP number
 * Sums historical funding amounts by year
 */
export function aggregateClinicsByHCP(clinics: Clinic[]): AggregatedClinic[] {
  // Group by HCP number
  const grouped = clinics.reduce((acc, clinic) => {
    const key = clinic.hcp_number
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(clinic)
    return acc
  }, {} as Record<string, Clinic[]>)

  // Aggregate each group
  return Object.values(grouped).map(clinicGroup => {
    // Use first clinic as base
    const baseClinic = clinicGroup[0]

    // Collect all application numbers
    const applicationNumbers = clinicGroup
      .map(c => c.application_number)
      .filter(Boolean) as string[]

    // Collect all unique locations
    const locations: LocationInfo[] = clinicGroup.map(clinic => ({
      address: clinic.address || '',
      city: clinic.city || '',
      state: clinic.state || '',
      zip: clinic.zip || '',
      application_number: clinic.application_number || undefined,
      filing_date: clinic.filing_date || undefined,
    }))

    // Aggregate historical funding by year
    const fundingByYear: AggregatedFunding = {}
    let totalFunding = 0

    clinicGroup.forEach(clinic => {
      if (clinic.historical_funding) {
        try {
          const fundingArray = clinic.historical_funding as HistoricalFundingItem[]
          fundingArray.forEach(item => {
            const year = item.year
            const amount = item.amount || 0

            if (!fundingByYear[year]) {
              fundingByYear[year] = 0
            }
            fundingByYear[year] += amount
            totalFunding += amount
          })
        } catch (error) {
          console.error('Error parsing historical_funding:', error)
        }
      }
    })

    return {
      ...baseClinic,
      application_count: clinicGroup.length,
      application_numbers: applicationNumbers,
      aggregated_funding: fundingByYear,
      total_funding: totalFunding,
      locations: locations,
    }
  })
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get sorted years from aggregated funding
 */
export function getSortedYears(aggregatedFunding: AggregatedFunding): string[] {
  return Object.keys(aggregatedFunding).sort()
}
