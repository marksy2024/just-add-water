'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft, MapPin, Save, Upload } from 'lucide-react'

const typeOptions = [
  { value: 'river', label: 'River' },
  { value: 'lake', label: 'Lake' },
  { value: 'coastal', label: 'Coastal' },
  { value: 'canal', label: 'Canal' },
]

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'challenging', label: 'Challenging' },
]

export default function NewRoutePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gpxGeojson, setGpxGeojson] = useState<Record<string, unknown> | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: 'river',
    difficulty: 'moderate',
    distance_km: '',
    description: '',
    put_in_description: '',
    put_in_lat: '',
    put_in_lng: '',
    take_out_description: '',
    take_out_lat: '',
    take_out_lng: '',
    best_season_notes: '',
    hubeau_station_code: '',
    min_water_level_notes: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGpxImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/routes/import-gpx', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to parse GPX')
      }

      const data = await res.json()

      // Pre-fill form with parsed data
      setGpxGeojson(data.geojson)
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        distance_km: data.distanceKm ? data.distanceKm.toString() : prev.distance_km,
        put_in_lat: data.putIn?.lat?.toString() || prev.put_in_lat,
        put_in_lng: data.putIn?.lng?.toString() || prev.put_in_lng,
        take_out_lat: data.takeOut?.lat?.toString() || prev.take_out_lat,
        take_out_lng: data.takeOut?.lng?.toString() || prev.take_out_lng,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GPX import failed')
    } finally {
      setImporting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        difficulty: form.difficulty,
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
        description: form.description.trim() || null,
        geojson: gpxGeojson || null,
        put_in_description: form.put_in_description.trim() || null,
        put_in_lat: form.put_in_lat ? parseFloat(form.put_in_lat) : null,
        put_in_lng: form.put_in_lng ? parseFloat(form.put_in_lng) : null,
        take_out_description: form.take_out_description.trim() || null,
        take_out_lat: form.take_out_lat ? parseFloat(form.take_out_lat) : null,
        take_out_lng: form.take_out_lng ? parseFloat(form.take_out_lng) : null,
        best_season_notes: form.best_season_notes.trim() || null,
        hubeau_station_code: form.hubeau_station_code.trim() || null,
        min_water_level_notes: form.min_water_level_notes.trim() || null,
      }

      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create route')
      }

      const route = await res.json()
      router.push(`/routes/${route.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/routes"
        className="inline-flex items-center gap-1 text-sm text-atlantic-blue hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Routes
      </Link>

      <h1 className="text-2xl font-extrabold text-deep-ocean">Add Route</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GPX Import */}
        <Card>
          <CardTitle className="mb-3">
            <Upload className="w-4 h-4 inline mr-1" />
            Import from GPX
          </CardTitle>
          <p className="text-xs text-driftwood mb-3">
            Upload a GPX file to auto-fill route coordinates and distance.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={handleGpxImport}
              disabled={importing}
              className="block w-full text-sm text-driftwood file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-atlantic-blue/10 file:text-atlantic-blue hover:file:bg-atlantic-blue/20 cursor-pointer disabled:opacity-50"
            />
          </label>
          {importing && (
            <p className="text-xs text-atlantic-blue mt-2">Parsing GPX file...</p>
          )}
          {gpxGeojson && (
            <p className="text-xs text-kelp-green mt-2">
              GPX imported successfully — form pre-filled with route data.
            </p>
          )}
        </Card>

        {/* Basic info */}
        <Card>
          <CardTitle className="mb-4">Route Details</CardTitle>
          <div className="space-y-4">
            <Input
              label="Route Name"
              placeholder="e.g. La Sèvre Niortaise — Damvix to Maillé"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Type"
                options={typeOptions}
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
              />

              <Select
                label="Difficulty"
                options={difficultyOptions}
                value={form.difficulty}
                onChange={(e) => updateField('difficulty', e.target.value)}
              />
            </div>

            <Input
              label="Distance (km)"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 12.5"
              value={form.distance_km}
              onChange={(e) => updateField('distance_km', e.target.value)}
            />

            <Textarea
              label="Description"
              placeholder="Describe the route — scenery, notable features, water character..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
        </Card>

        {/* Put-in / Take-out */}
        <Card>
          <CardTitle className="mb-4">
            <MapPin className="w-4 h-4 inline mr-1" />
            Put-in & Take-out
          </CardTitle>
          <div className="space-y-4">
            <Textarea
              label="Put-in Description"
              placeholder="Describe the launch point — parking, access, facilities..."
              value={form.put_in_description}
              onChange={(e) => updateField('put_in_description', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Put-in Latitude"
                type="number"
                step="any"
                placeholder="46.3456"
                value={form.put_in_lat}
                onChange={(e) => updateField('put_in_lat', e.target.value)}
              />
              <Input
                label="Put-in Longitude"
                type="number"
                step="any"
                placeholder="-0.7654"
                value={form.put_in_lng}
                onChange={(e) => updateField('put_in_lng', e.target.value)}
              />
            </div>

            <Textarea
              label="Take-out Description"
              placeholder="Describe the exit point — parking, access, facilities..."
              value={form.take_out_description}
              onChange={(e) => updateField('take_out_description', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Take-out Latitude"
                type="number"
                step="any"
                placeholder="46.4567"
                value={form.take_out_lat}
                onChange={(e) => updateField('take_out_lat', e.target.value)}
              />
              <Input
                label="Take-out Longitude"
                type="number"
                step="any"
                placeholder="-0.6543"
                value={form.take_out_lng}
                onChange={(e) => updateField('take_out_lng', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Season & conditions */}
        <Card>
          <CardTitle className="mb-4">Conditions & Season</CardTitle>
          <div className="space-y-4">
            <Textarea
              label="Best Season Notes"
              placeholder="e.g. Best March to June when water levels are moderate..."
              value={form.best_season_notes}
              onChange={(e) => updateField('best_season_notes', e.target.value)}
            />

            <Input
              label="Hub'Eau Station Code (optional)"
              placeholder="e.g. L300001001"
              value={form.hubeau_station_code}
              onChange={(e) => updateField('hubeau_station_code', e.target.value)}
            />

            <Textarea
              label="Minimum Water Level Notes"
              placeholder="e.g. Below 0.30m at Damvix gauge the portage at the mill becomes unavoidable..."
              value={form.min_water_level_notes}
              onChange={(e) => updateField('min_water_level_notes', e.target.value)}
            />
          </div>
        </Card>

        {/* Submit */}
        {error && (
          <p className="text-sm text-red-flag">{error}</p>
        )}

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          <Save className="w-4 h-4" />
          Save Route
        </Button>
      </form>
    </div>
  )
}
