import { AlertBanner } from '@/components/alerts/AlertBanner'
import { ClinicList } from '@/components/clinics/ClinicList'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          View and manage USAC RHC Form 465 filers pending outreach
        </p>
      </div>

      {/* Alerts Section */}
      <AlertBanner />

      {/* Clinics Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Clinics Pending Review</h3>
        <ClinicList />
      </div>
    </div>
  )
}
