'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, AlertTriangle, CheckCircle, Phone, Clock } from 'lucide-react'

interface FloatPlanCardProps {
  paddleId: string
  floatPlan: {
    id: string
    expectedReturnTime: string | Date
    emergencyContactName: string
    emergencyContactPhone: string
    status: string
    activatedAt: string | Date
    completedAt: string | Date | null
  }
}

export function FloatPlanCard({ paddleId, floatPlan }: FloatPlanCardProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)

  const expectedReturn = new Date(floatPlan.expectedReturnTime)
  const isOverdue = floatPlan.status === 'active' && new Date() > expectedReturn
  const isCompleted = floatPlan.status === 'completed'

  async function markComplete() {
    setCompleting(true)
    try {
      const res = await fetch(`/api/paddles/${paddleId}/float-plan`, {
        method: 'PATCH',
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // silently fail
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div>
      {/* Overdue banner */}
      {isOverdue && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl bg-red-flag/10 border border-red-flag/20 border-b-0">
          <AlertTriangle className="w-4 h-4 text-red-flag" />
          <span className="text-sm font-semibold text-red-flag">
            Float plan overdue — expected back {expectedReturn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      <Card
        padding="sm"
        className={`${isOverdue ? 'rounded-t-none border-t-0' : ''} ${isCompleted ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className={`w-4 h-4 ${isOverdue ? 'text-red-flag' : isCompleted ? 'text-driftwood' : 'text-kelp-green'}`} />
          <span className="text-sm font-semibold text-deep-ocean">Float Plan</span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-kelp-green bg-kelp-green/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Phone className="w-3.5 h-3.5 text-driftwood mt-0.5" />
            <div>
              <p className="text-xs text-driftwood">Emergency Contact</p>
              <p className="font-semibold text-deep-ocean">{floatPlan.emergencyContactName}</p>
              <a href={`tel:${floatPlan.emergencyContactPhone}`} className="text-xs text-atlantic-blue">
                {floatPlan.emergencyContactPhone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-driftwood mt-0.5" />
            <div>
              <p className="text-xs text-driftwood">Expected Return</p>
              <p className={`font-semibold ${isOverdue ? 'text-red-flag' : 'text-deep-ocean'}`}>
                {expectedReturn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {' '}
                {expectedReturn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {!isCompleted && (
          <div className="mt-3 pt-3 border-t border-storm-grey/10">
            <Button
              size="sm"
              variant="outline"
              onClick={markComplete}
              loading={completing}
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
