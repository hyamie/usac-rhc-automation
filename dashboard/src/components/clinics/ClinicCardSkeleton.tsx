export function ClinicCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3 mb-6">
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3 mb-6">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex gap-2">
        <div className="h-9 bg-muted rounded w-24"></div>
        <div className="h-9 bg-muted rounded w-24"></div>
        <div className="h-9 bg-muted rounded w-24"></div>
      </div>
    </div>
  )
}
