'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, PlayCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface TriggerResult {
  success: boolean
  summary: {
    total_fetched: number
    inserted: number
    skipped: number
    errors: number
  }
  details?: {
    inserted: any[]
    skipped: any[]
    errors: any[]
  }
  error?: string
}

export function ManualTrigger() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TriggerResult | null>(null)

  const handleTrigger = async () => {
    if (!startDate) {
      alert('Please select a start date')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/trigger-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          endDate: endDate || undefined
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        summary: { total_fetched: 0, inserted: 0, skipped: 0, errors: 1 },
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Manual Workflow Trigger
        </CardTitle>
        <CardDescription>
          Pull USAC Form 465 filings for a specific date or date range. Duplicates will be automatically skipped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date (Optional)</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          onClick={handleTrigger}
          disabled={isLoading || !startDate}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching records...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Trigger Workflow
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? 'Workflow Completed' : 'Workflow Failed'}
            </AlertTitle>
            <AlertDescription>
              {result.success ? (
                <div className="space-y-1 mt-2">
                  <p><strong>Total Fetched:</strong> {result.summary.total_fetched} records</p>
                  <p className="text-green-600"><strong>Inserted:</strong> {result.summary.inserted} new records</p>
                  <p className="text-blue-600"><strong>Skipped:</strong> {result.summary.skipped} duplicates</p>
                  {result.summary.errors > 0 && (
                    <div className="text-red-600 space-y-2 mt-2">
                      <p><strong>Errors:</strong> {result.summary.errors} records</p>
                      {result.details?.errors && result.details.errors.length > 0 && (
                        <div className="mt-2 max-h-60 overflow-y-auto text-xs bg-red-50 p-2 rounded">
                          <p className="font-semibold mb-2">Error Details (showing first 5):</p>
                          {result.details.errors.slice(0, 5).map((err: any, idx: number) => (
                            <div key={idx} className="mb-2 p-2 bg-white rounded border border-red-200">
                              <p><strong>HCP:</strong> {err.hcp_number}</p>
                              <p className="mt-1"><strong>Error:</strong> {typeof err.error === 'string' ? err.error : JSON.stringify(err.error)}</p>
                            </div>
                          ))}
                          {result.details.errors.length > 5 && (
                            <p className="mt-2 italic">...and {result.details.errors.length - 5} more errors</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2">{result.error || 'An unknown error occurred'}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
