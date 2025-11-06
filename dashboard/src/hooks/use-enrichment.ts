import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface EnrichClinicParams {
  clinicId: string
  hcpNumber: string
  clinicName: string
}

export function useEnrichment() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ clinicId, hcpNumber, clinicName }: EnrichClinicParams) => {
      // Call the API route that will trigger the n8n webhook
      const response = await fetch('/api/enrichment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId,
          hcpNumber,
          clinicName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to trigger enrichment')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch clinic data
      queryClient.invalidateQueries({ queryKey: ['clinics'] })
      queryClient.invalidateQueries({ queryKey: ['clinic', variables.clinicId] })
    },
  })
}
