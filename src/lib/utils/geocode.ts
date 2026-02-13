/**
 * Geocode a city name to latitude/longitude using the free Nominatim API.
 * Rate-limited to 1 request/second. Used server-side or client-side.
 *
 * Returns null if geocoding fails or city not found.
 */
export async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!city || city.trim().length < 2) return null

  try {
    const encoded = encodeURIComponent(city.trim())
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=fr`,
      {
        headers: {
          'User-Agent': 'Padelia/1.0 (padel matching app)',
        },
      },
    )

    if (!response.ok) return null

    const results = await response.json() as Array<{ lat: string; lon: string }>

    if (results.length === 0) return null

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    }
  } catch {
    return null
  }
}
