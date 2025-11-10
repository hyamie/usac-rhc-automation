import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

export interface ClinicsFilters {
  state?: string
  funding_year?: string
  application_type?: string
  processed?: boolean | 'has_notes'  // Can be true, false, or 'has_notes'
  dateFrom?: string
  dateTo?: string
  searchTerm?: string  // Search across all text fields
}

export function useClinics(filters: ClinicsFilters = {}) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clinics', filters],
    queryFn: async () => {
      let query = supabase
        .from('clinics_pending_review')
        .select('*')
        .order('filing_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.state) {
        query = query.eq('state', filters.state)
      }

      if (filters.funding_year) {
        query = query.eq('funding_year', filters.funding_year)
      }

      if (filters.application_type) {
        query = query.eq('application_type', filters.application_type)
      }

      // Handle processed filter (including 'has_notes' option)
      if (filters.processed !== undefined) {
        if (filters.processed === 'has_notes') {
          // Filter for clinics with non-empty notes array
          query = query.not('notes', 'eq', '[]')
        } else {
          query = query.eq('processed', filters.processed)
        }
      }

      if (filters.dateFrom) {
        query = query.gte('filing_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lt('filing_date', filters.dateTo)
      }

      // Handle search term - search across all text fields
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchPattern = `%${filters.searchTerm.trim()}%`
        query = query.or(`
          clinic_name.ilike.${searchPattern},
          hcp_number.ilike.${searchPattern},
          application_number.ilike.${searchPattern},
          address.ilike.${searchPattern},
          city.ilike.${searchPattern},
          state.ilike.${searchPattern},
          zip.ilike.${searchPattern},
          contact_phone.ilike.${searchPattern},
          contact_email.ilike.${searchPattern},
          mail_contact_first_name.ilike.${searchPattern},
          mail_contact_last_name.ilike.${searchPattern},
          mail_contact_org_name.ilike.${searchPattern},
          mail_contact_phone.ilike.${searchPattern},
          mail_contact_email.ilike.${searchPattern},
          service_type.ilike.${searchPattern},
          funding_year.ilike.${searchPattern},
          application_type.ilike.${searchPattern}
        `.replace(/\s+/g, ''))
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as Clinic[]
    },
  })
}

export function useClinic(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['clinic', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics_pending_review')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return data as Clinic
    },
    enabled: !!id,
  })
}
