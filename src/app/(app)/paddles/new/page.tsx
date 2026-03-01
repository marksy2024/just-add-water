'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Waves } from 'lucide-react'

interface Route {
  id: string
  name: string
  type: string
  distanceKm: number | null
}

export default function NewPaddlePage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdPaddleId, setCreatedPaddleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [routeId, setRouteId] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchRoutes() {
      const res = await fetch('/api/routes')
      const data = await res.json()
      if (data) setRoutes(data)
    }
    fetchRoutes()
  }, [])

  // Auto-fill distance when route is selected
  useEffect(() => {
    if (routeId && routeId !== 'other') {
      const route = routes.find((r) => r.id === routeId)
      if (route?.distanceKm) {
        setDistanceKm(route.distanceKm.toString())
      }
    }
  }, [routeId, routes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const totalMinutes =
      (parseInt(durationHours || '0') * 60) + parseInt(durationMinutes || '0')

    try {
      const res = await fetch('/api/paddles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          route_id: routeId && routeId !== 'other' ? routeId : null,
          status: 'completed',
          start_time: startTime || null,
          distance_km: distanceKm ? parseFloat(distanceKm) : null,
          duration_minutes: totalMinutes > 0 ? totalMinutes : null,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to log paddle')
      }

      const { paddle } = await res.json()
      setCreatedPaddleId(paddle.id)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success && createdPaddleId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-kelp-green/10 mb-4">
            <CheckCircle className="w-8 h-8 text-kelp-green" />
          </div>
          <h1 className="text-2xl font-extrabold text-deep-ocean mb-2">
            Paddle Logged!
          </h1>
          <p className="text-driftwood">
            Nice one — your paddle has been saved.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href={`/paddles/${createdPaddleId}`}>
            <Button className="w-full">View Paddle</Button>
          </Link>
          <Link href="/paddles">
            <Button variant="outline" className="w-full">
              All Paddles
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => {
            setSuccess(false)
            setCreatedPaddleId(null)
            setTitle('')
            setDistanceKm('')
            setDurationHours('')
            setDurationMinutes('')
            setStartTime('')
            setNotes('')
            setRouteId('')
          }}>
            Log Another
          </Button>
        </div>
      </div>
    )
  }

  const routeOptions = [
    { value: '', label: 'Select a route' },
    ...routes.map((r) => ({
      value: r.id,
      label: `${r.name} (${r.type})`,
    })),
    { value: 'other', label: 'Other / unlisted route' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-storm-grey/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-storm-grey" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-deep-ocean">Log a Paddle</h1>
          <p className="text-sm text-driftwood">Record a completed session</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-flag/10 border border-red-flag/20 text-sm text-red-flag">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <div className="space-y-4">
            <Input
              label="Paddle Title"
              placeholder="e.g. Morning paddle at Lough Erne"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Select
              label="Route"
              options={routeOptions}
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
            />

            <Input
              label="Distance (km)"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 8.5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-deep-ocean mb-1.5">
                Duration
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    placeholder="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-driftwood pointer-events-none">
                    hrs
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-driftwood pointer-events-none">
                    min
                  </span>
                </div>
              </div>
            </div>

            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <Textarea
              label="Notes"
              placeholder="How was the paddle? Conditions, highlights, anything to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <Waves className="w-5 h-5" />
          Log Paddle
        </Button>
      </form>
    </div>
  )
}
