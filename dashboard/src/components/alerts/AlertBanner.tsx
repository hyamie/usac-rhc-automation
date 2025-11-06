'use client'

import { useAlerts, useDismissAlert } from '@/hooks/use-alerts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export function AlertBanner() {
  const { data: alerts, isLoading } = useAlerts()
  const { mutate: dismissAlert } = useDismissAlert()

  if (isLoading || !alerts || alerts.length === 0) {
    return null
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive' as const
      case 'warning':
        return 'warning' as const
      default:
        return 'info' as const
    }
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getVariant(alert.severity)}>
          {getIcon(alert.severity)}
          <div className="flex-1">
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.message && (
              <AlertDescription>{alert.message}</AlertDescription>
            )}
            {alert.url && (
              <AlertDescription>
                <a
                  href={alert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:no-underline"
                >
                  Learn more
                </a>
              </AlertDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 absolute top-4 right-4"
            onClick={() => dismissAlert(alert.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
