import { AlertBanner } from '@/components/alerts/AlertBanner'
import { ClinicList } from '@/components/clinics/ClinicList'

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-lg text-muted-foreground max-w-3xl">
          View and manage USAC RHC Form 465 filers pending outreach
        </p>
      </div>

      {/* Alerts Section */}
      <AlertBanner />

      {/* Clinics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold tracking-tight">Clinics Pending Review</h3>
        </div>
        <ClinicList />
      </div>
    </div>
  )
}
