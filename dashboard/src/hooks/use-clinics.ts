import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

export interface ClinicsFilters {
  state?: string
  funding_year?: string
  application_type?: string
  processed?: boolean
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

      if (filters.processed !== undefined) {
        query = query.eq('processed', filters.processed)
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
