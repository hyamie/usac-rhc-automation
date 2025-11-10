/**
 * Geocoding utilities using OpenStreetMap Nominatim (free, no API key)
 */

interface GeocodeResult {
  latitude: number
  longitude: number
  display_name?: string
}

/**
 * Geocode an address using OpenStreetMap Nominatim
 * Free service, rate limited to 1 request per second
 * @param address Full address string or components
 * @param city City name
 * @param state State abbreviation
 * @param zip ZIP code
 * @returns Coordinates or null if not found
 */
export async function geocodeAddress(
  address?: string,
  city?: string,
  state?: string,
  zip?: string
): Promise<GeocodeResult | null> {
  try {
    // Build query string
    const parts = [address, city, state, zip].filter(Boolean)
    if (parts.length === 0) return null

    const query = parts.join(', ')

    // Call Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'us'
    })

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'USAC-RHC-Dashboard/1.0' // Required by Nominatim
      }
    })

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.warn('No geocoding results for:', query)
      return null
    }

    const result = data[0]
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Batch geocode multiple addresses with rate limiting
 * @param addresses Array of address objects
 * @param delayMs Delay between requests (default 1000ms for Nominatim)
 * @returns Array of results
 */
export async function batchGeocode(
  addresses: Array<{
    id: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }>,
  delayMs: number = 1100
): Promise<Array<{ id: string; result: GeocodeResult | null }>> {
  const results: Array<{ id: string; result: GeocodeResult | null }> = []

  for (const addr of addresses) {
    const result = await geocodeAddress(
      addr.address,
      addr.city,
      addr.state,
      addr.zip
    )

    results.push({ id: addr.id, result })

    // Rate limiting
    if (addresses.indexOf(addr) < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Save geocoded coordinates to database
 */
export async function saveGeocodedCoordinates(
  clinicId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  try {
    const response = await fetch(`/api/clinics/${clinicId}/geocode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    })

    return response.ok
  } catch (error) {
    console.error('Error saving coordinates:', error)
    return false
  }
}
