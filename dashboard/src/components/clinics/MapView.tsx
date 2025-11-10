'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngExpression } from 'leaflet'
import type { Database } from '@/types/database.types'
import { MapPin, DollarSign, Building2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { geocodeAddress, saveGeocodedCoordinates } from '@/lib/geocoding'

type Clinic = Database['public']['Tables']['clinics_pending_review']['Row']

interface MapViewProps {
  clinics: Clinic[]
  onClinicClick?: (clinic: Clinic) => void
}

// Component to fit bounds when clinics change
function MapBounds({ clinics }: { clinics: Clinic[] }) {
  const map = useMap()

  useEffect(() => {
    if (clinics.length > 0) {
      const validClinics = clinics.filter(c => c.latitude && c.longitude)
      if (validClinics.length > 0) {
        const bounds = validClinics.map(c => [c.latitude!, c.longitude!] as LatLngExpression)
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [clinics, map])

  return null
}

export function MapView({ clinics, onClinicClick }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [geocodedClinics, setGeocodedClinics] = useState<Map<string, { lat: number; lng: number }>>(new Map())
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 })

  // Only render map on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Auto-geocode clinics without coordinates
  useEffect(() => {
    if (!isMounted) return

    const clinicsToGeocode = clinics.filter(
      c => !c.latitude && !c.longitude && (c.city || c.address) && !geocodedClinics.has(c.id)
    )

    if (clinicsToGeocode.length > 0 && !isGeocoding) {
      geocodeClinics(clinicsToGeocode)
    }
  }, [clinics, isMounted, geocodedClinics, isGeocoding])

  const geocodeClinics = async (clinicsToGeocode: Clinic[]) => {
    setIsGeocoding(true)
    setGeocodingProgress({ current: 0, total: clinicsToGeocode.length })

    // Limit to first 10 to avoid rate limiting
    const batch = clinicsToGeocode.slice(0, 10)

    for (let i = 0; i < batch.length; i++) {
      const clinic = batch[i]
      setGeocodingProgress({ current: i + 1, total: batch.length })

      try {
        const result = await geocodeAddress(clinic.address || undefined, clinic.city, clinic.state, clinic.zip)

        if (result) {
          // Save to state
          setGeocodedClinics(prev => new Map(prev).set(clinic.id, { lat: result.latitude, lng: result.longitude }))

          // Save to database
          await saveGeocodedCoordinates(clinic.id, result.latitude, result.longitude)
        }

        // Rate limit: wait 1.1 seconds between requests
        if (i < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1100))
        }
      } catch (error) {
        console.error('Geocoding error for clinic:', clinic.clinic_name, error)
      }
    }

    setIsGeocoding(false)
  }

  // Combine database coordinates with newly geocoded ones
  const mappableClinics = clinics.filter(clinic => {
    const hasDbCoords = clinic.latitude && clinic.longitude
    const hasGeocodedCoords = geocodedClinics.has(clinic.id)
    return hasDbCoords || hasGeocodedCoords
  }).map(clinic => {
    const geocoded = geocodedClinics.get(clinic.id)
    if (geocoded) {
      return { ...clinic, latitude: geocoded.lat, longitude: geocoded.lng }
    }
    return clinic
  })

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    )
  }

  if (isGeocoding && mappableClinics.length === 0) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-muted flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">Geocoding Addresses...</h3>
          <p className="text-muted-foreground">
            Finding coordinates for {geocodingProgress.current} of {geocodingProgress.total} clinics
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This may take a minute due to rate limiting (1 req/sec)
          </p>
        </div>
      </div>
    )
  }

  if (mappableClinics.length === 0 && !isGeocoding) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-muted flex flex-col items-center justify-center gap-4">
        <MapPin className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">No Locations Available</h3>
          <p className="text-muted-foreground">
            No clinics could be geocoded. Please ensure they have valid city/state information.
          </p>
        </div>
      </div>
    )
  }

  // Default center (US center)
  const defaultCenter: LatLngExpression = [39.8283, -98.5795]

  // Custom marker icon
  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border shadow-sm relative">
      {/* Geocoding Progress Badge */}
      {isGeocoding && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white dark:bg-card border shadow-lg rounded-lg px-4 py-2 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">
            Geocoding {geocodingProgress.current}/{geocodingProgress.total} clinics...
          </span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={4}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds clinics={mappableClinics} />

        {mappableClinics.map((clinic) => (
          <Marker
            key={clinic.id}
            position={[clinic.latitude!, clinic.longitude!]}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                if (onClinicClick) {
                  onClinicClick(clinic)
                }
              }
            }}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-base mb-2">{clinic.clinic_name}</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>
                      {clinic.city}, {clinic.state} {clinic.zip}
                    </span>
                  </div>

                  {clinic.requested_amount && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                      <span className="font-semibold text-green-700">
                        {formatCurrency(clinic.requested_amount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">HCP #{clinic.hcp_number}</span>
                  </div>
                </div>

                {clinic.funding_year && (
                  <div className="mt-3 pt-2 border-t">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      FY {clinic.funding_year}
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
