'use client'

import { Button } from '@/components/ui/button'
import { useEnrichment } from '@/hooks/use-enrichment'
import { Loader2 } from 'lucide-react'

interface EnrichmentButtonProps {
  clinicId: string
  hcpNumber: string
  clinicName: string
  enriched: boolean
  disabled?: boolean
}

export function EnrichmentButton({
  clinicId,
  hcpNumber,
  clinicName,
  enriched,
  disabled = false,
}: EnrichmentButtonProps) {
  const { mutate: enrich, isPending } = useEnrichment()

  const handleEnrich = () => {
    enrich({ clinicId, hcpNumber, clinicName })
  }

  if (enriched) {
    return (
      <Button variant="outline" disabled>
        Enriched
      </Button>
    )
  }

  return (
    <Button
      onClick={handleEnrich}
      disabled={disabled || isPending}
      size="sm"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enriching...
        </>
      ) : (
        'Enrich Data'
      )}
    </Button>
  )
}
