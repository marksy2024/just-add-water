'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Trophy } from 'lucide-react'

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const ROUTE_FILTER_OPTIONS = [
  { value: '', label: 'Any route type' },
  { value: 'river', label: 'River' },
  { value: 'lake', label: 'Lake' },
  { value: 'coastal', label: 'Coastal' },
  { value: 'canal', label: 'Canal' },
]

export default function NewChallengePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetKm, setTargetKm] = useState('')
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [routeType, setRouteType] = useState('')

  const currentYear = now.getFullYear()
  const yearOptions = [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear + 1), label: String(currentYear + 1) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        target_km: parseFloat(targetKm),
        month: parseInt(month),
        year: parseInt(year),
      }

      if (routeType) {
        body.route_filter = { type: routeType }
      }

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create challenge')
      }

      router.push('/challenges')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-extrabold text-deep-ocean">
            Create Challenge
          </h1>
          <p className="text-sm text-driftwood">
            Rally the group with a distance target
          </p>
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
              label="Challenge Title"
              placeholder="e.g. March 100km Challenge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="What's this challenge about? Motivate the group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Input
              label="Target Distance (km)"
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 100"
              value={targetKm}
              onChange={(e) => setTargetKm(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Month"
                options={MONTH_OPTIONS}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <Select
                label="Year"
                options={yearOptions}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <Select
              label="Route Filter (optional)"
              options={ROUTE_FILTER_OPTIONS}
              value={routeType}
              onChange={(e) => setRouteType(e.target.value)}
            />

            {routeType && (
              <p className="text-xs text-driftwood">
                Only{' '}
                <span className="font-semibold capitalize">{routeType}</span>{' '}
                paddles will count towards this challenge.
              </p>
            )}
          </div>
        </Card>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          <Trophy className="w-5 h-5" />
          Create Challenge
        </Button>
      </form>
    </div>
  )
}
