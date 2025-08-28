'use client'

import { useRouter, useParams } from 'next/navigation'
import FlashcardReview from '@/components/FlashcardReview'

export default function NoteFlashcardsPage() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string

  const handleExit = () => {
    router.push(`/notes/${noteId}`)
  }

  const handleComplete = (stats: { correct: number; total: number }) => {
    console.log('Note flashcard review completed:', stats)
    setTimeout(() => {
      router.push(`/notes/${noteId}`)
    }, 3000)
  }

  return (
    <FlashcardReview 
      noteId={noteId}
      onExit={handleExit}
      onComplete={handleComplete}
    />
  )
}