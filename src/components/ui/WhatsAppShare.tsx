'use client'

import { Share2 } from 'lucide-react'
import { Button } from './Button'

interface WhatsAppShareProps {
  message: string
  buttonText?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function WhatsAppShare({ message, buttonText = 'Share to WhatsApp', variant = 'outline', size = 'sm' }: WhatsAppShareProps) {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
      <Button variant={variant} size={size} type="button">
        <Share2 className="w-4 h-4" />
        {buttonText}
      </Button>
    </a>
  )
}
