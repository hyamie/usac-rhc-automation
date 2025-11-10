'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngExpression } from 'leaflet'
import type { Database } from '@/types/database.types'
import { MapPin, DollarSign, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

  // Only render map on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filter clinics with valid coordinates
  const mappableClinics = clinics.filter(
    clinic => clinic.latitude && clinic.longitude
  )

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    )
  }

  if (mappableClinics.length === 0) {
    return (
      <div className="w-full h-[600px] rounded-lg border bg-muted flex flex-col items-center justify-center gap-4">
        <MapPin className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">No Locations Available</h3>
          <p className="text-muted-foreground">
            No clinics have geographic coordinates to display on the map.
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
    <div className="w-full h-[600px] rounded-lg overflow-hidden border shadow-sm">
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
