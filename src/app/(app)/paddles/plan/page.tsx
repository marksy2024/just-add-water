'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Calendar, Users } from 'lucide-react'
import { formatDate, formatDateShort } from '@/lib/utils'
import { PaddlerPicker } from '@/components/paddles/PaddlerPicker'

interface Route {
  id: string
  name: string
  type: string
  distanceKm: number | null
}

interface AppUser {
  id: string
  name: string | null
  email: string
}

export default function PlanPaddlePage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [allUsers, setAllUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdPaddleId, setCreatedPaddleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [numberOfDays, setNumberOfDays] = useState('1')
  const [routeId, setRouteId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPaddlerIds, setSelectedPaddlerIds] = useState<string[]>([])

  // Store for success screen
  const [createdPaddleDetails, setCreatedPaddleDetails] = useState<{
    routeName: string
    date: string
    endDate: string | null
    startTime: string
    distance: number | null
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [routesRes, usersRes] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/users'),
      ])
      const routesData = await routesRes.json()
      if (routesData) setRoutes(routesData)
      const usersData = await usersRes.json()
      if (usersData?.users) setAllUsers(usersData.users)
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const selectedRoute = routes.find((r) => r.id === routeId)

    // Compute end_date for multi-day trips
    const days = parseInt(numberOfDays, 10)
    let endDate: string | null = null
    if (days > 1 && date) {
      const d = new Date(date)
      d.setDate(d.getDate() + days - 1)
      endDate = d.toISOString().split('T')[0]
    }

    try {
      const res = await fetch('/api/paddles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          end_date: endDate,
          route_id: routeId && routeId !== 'other' ? routeId : null,
          status: 'planned',
          start_time: startTime || null,
          distance_km: selectedRoute?.distanceKm || null,
          notes: notes.trim() || null,
          participant_ids: selectedPaddlerIds.length > 0 ? selectedPaddlerIds : undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create paddle')
      }

      const { paddle } = await res.json()
      setCreatedPaddleId(paddle.id)
      setCreatedPaddleDetails({
        routeName: selectedRoute?.name || title.trim(),
        date,
        endDate,
        startTime,
        distance: selectedRoute?.distanceKm || null,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success && createdPaddleId && createdPaddleDetails) {
    const appLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/paddles/${createdPaddleId}`
    const timeStr = createdPaddleDetails.startTime
      ? createdPaddleDetails.startTime.slice(0, 5)
      : ''
    const distStr = createdPaddleDetails.distance
      ? `\n\u{1F4CF} ${createdPaddleDetails.distance}km`
      : ''

    const dateDisplay = createdPaddleDetails.endDate
      ? `${formatDateShort(createdPaddleDetails.date)} \u2013 ${formatDate(createdPaddleDetails.endDate)}`
      : formatDate(createdPaddleDetails.date)

    const whatsappMessage = [
      '\u{1F6F6} Paddle proposed!',
      `\u{1F4CD} ${createdPaddleDetails.routeName}`,
      `\u{1F4C5} ${dateDisplay}${timeStr ? `, ${timeStr}` : ''}`,
      distStr ? `\u{1F4CF} ${createdPaddleDetails.distance}km` : '',
      `\u{1F449} Details & RSVP: ${appLink}`,
    ].filter(Boolean).join('\n')

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-kelp-green/10 mb-4">
            <CheckCircle className="w-8 h-8 text-kelp-green" />
          </div>
          <h1 className="text-2xl font-extrabold text-deep-ocean mb-2">
            Paddle Planned!
          </h1>
          <p className="text-driftwood">
            Share it with the group so others can join.
          </p>
        </div>

        {/* Share card */}
        <Card className="text-center">
          <p className="text-sm text-storm-grey mb-4">
            Let your paddling group know about this trip:
          </p>
          <WhatsAppShare
            message={whatsappMessage}
            buttonText="Share to WhatsApp Group"
            variant="primary"
            size="md"
          />
        </Card>

        <div className="flex flex-col gap-3">
          <Link href={`/paddles/${createdPaddleId}`}>
            <Button variant="outline" className="w-full">View Paddle Details</Button>
          </Link>
          <Link href="/paddles">
            <Button variant="ghost" className="w-full">
              All Paddles
            </Button>
          </Link>
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

  // Set min date to today for planning
  const today = new Date().toISOString().split('T')[0]

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
          <h1 className="text-2xl font-extrabold text-deep-ocean">Plan a Paddle</h1>
          <p className="text-sm text-driftwood">Propose a group outing</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-shallows/10 border border-shallows/20">
        <Users className="w-5 h-5 text-atlantic-blue mt-0.5 shrink-0" />
        <p className="text-sm text-atlantic-blue">
          Create a paddle plan and share it with your group. Others can RSVP and coordinate shuttle logistics.
        </p>
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
              placeholder="e.g. Saturday Lough Erne group paddle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Select
              label="Route"
              options={routeOptions}
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
            />

            <Input
              label="Date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Select
              label="Number of Days"
              options={Array.from({ length: 14 }, (_, i) => ({
                value: String(i + 1),
                label: i === 0 ? '1 day' : `${i + 1} days`,
              }))}
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(e.target.value)}
            />

            <Input
              label="Meeting Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <Textarea
              label="Notes"
              placeholder="Meeting point details, what to bring, skill level expectations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        {allUsers.length > 0 && (
          <Card>
            <PaddlerPicker
              allUsers={allUsers}
              selectedIds={selectedPaddlerIds}
              onChange={setSelectedPaddlerIds}
            />
          </Card>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <Calendar className="w-5 h-5" />
          Create Paddle Plan
        </Button>
      </form>
    </div>
  )
}
