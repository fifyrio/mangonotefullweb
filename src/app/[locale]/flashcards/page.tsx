'use client'

import { useRouter } from 'next/navigation'
import FlashcardReview from '@/components/FlashcardReview'

export default function FlashcardReviewPage() {
  const router = useRouter()

  const handleExit = () => {
    router.push('/dashboard')
  }

  const handleComplete = (stats: { correct: number; total: number }) => {
    console.log('Review completed:', stats)
    // Could show completion modal or redirect after delay
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
  }

  return (
    <FlashcardReview 
      onExit={handleExit}
      onComplete={handleComplete}
    />
  )
}