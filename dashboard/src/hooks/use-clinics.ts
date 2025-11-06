import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

export interface ClinicsFilters {
  state?: string
  priority?: 'High' | 'Medium' | 'Low'
  enriched?: boolean
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
        .order('priority_score', { ascending: false })
        .order('filing_date', { ascending: false })

      if (filters.state) {
        query = query.eq('state', filters.state)
      }

      if (filters.priority) {
        query = query.eq('priority_label', filters.priority)
      }

      if (filters.enriched !== undefined) {
        query = query.eq('enriched', filters.enriched)
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
