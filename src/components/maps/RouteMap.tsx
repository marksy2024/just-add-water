'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface PhotoPin {
  id: string
  lat: number
  lng: number
  thumbnailUrl: string
  caption?: string | null
}

interface RouteMapProps {
  geojson?: Record<string, unknown> | null
  putIn?: { lat: number; lng: number; description?: string | null }
  takeOut?: { lat: number; lng: number; description?: string | null }
  photos?: PhotoPin[]
  height?: string
  className?: string
}

export function RouteMap({ geojson, putIn, takeOut, photos, height = '300px', className = '' }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap contributors',
      maxZoom: 17,
    }).addTo(map)

    const bounds: L.LatLngExpression[] = []

    // Put-in marker (green)
    if (putIn) {
      const putInIcon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:#059669;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">P</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      })
      L.marker([putIn.lat, putIn.lng], { icon: putInIcon })
        .addTo(map)
        .bindPopup(`<strong>Put-in</strong>${putIn.description ? `<br/>${putIn.description}` : ''}`)
      bounds.push([putIn.lat, putIn.lng])
    }

    // Take-out marker (red)
    if (takeOut) {
      const takeOutIcon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:#DC2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">T</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      })
      L.marker([takeOut.lat, takeOut.lng], { icon: takeOutIcon })
        .addTo(map)
        .bindPopup(`<strong>Take-out</strong>${takeOut.description ? `<br/>${takeOut.description}` : ''}`)
      bounds.push([takeOut.lat, takeOut.lng])
    }

    // Route geometry
    if (geojson) {
      const geoLayer = L.geoJSON(geojson as unknown as GeoJSON.GeoJsonObject, {
        style: {
          color: '#0C4A6E',
          weight: 3,
          opacity: 0.8,
        },
      }).addTo(map)
      const geoBounds = geoLayer.getBounds()
      if (geoBounds.isValid()) {
        bounds.push(geoBounds.getSouthWest(), geoBounds.getNorthEast())
      }
    }

    // Photo markers
    if (photos && photos.length > 0) {
      const cameraIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;background:#7C3AED;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;">&#128247;</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: '',
      })

      for (const photo of photos) {
        const popup = `<div style="text-align:center;max-width:160px;"><img src="${photo.thumbnailUrl}" alt="${photo.caption || 'Photo'}" style="width:140px;height:auto;border-radius:8px;margin-bottom:4px;" />${photo.caption ? `<p style="font-size:11px;margin:0;">${photo.caption}</p>` : ''}</div>`
        L.marker([photo.lat, photo.lng], { icon: cameraIcon })
          .addTo(map)
          .bindPopup(popup)
        bounds.push([photo.lat, photo.lng])
      }
    }

    // Fit bounds
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] })
    } else {
      // Default to Vendée region
      map.setView([46.67, -1.43], 10)
    }

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [geojson, putIn, takeOut, photos])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`rounded-xl overflow-hidden ${className}`}
    />
  )
}
