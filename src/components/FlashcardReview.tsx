'use client'

import { useState, useEffect } from 'react'
import { FlashcardClientService, FlashcardWithProgress } from '@/lib/flashcard-client-service'

interface FlashcardReviewProps {
  noteId?: string
  onComplete?: (stats: { correct: number; total: number; sessionId?: string }) => void
  onExit?: () => void
}

export default function FlashcardReview({ noteId, onComplete, onExit }: FlashcardReviewProps) {
  const [flashcards, setFlashcards] = useState<FlashcardWithProgress[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reviewStats, setReviewStats] = useState({ correct: 0, total: 0 })
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [cardStartTime, setCardStartTime] = useState<number>(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)

  const flashcardService = new FlashcardClientService()
  const currentCard = flashcards[currentIndex]

  useEffect(() => {
    loadFlashcards()
    initializeSession()
  }, [noteId])

  const initializeSession = async () => {
    try {
      // For now, we'll use a simple timestamp as session ID
      // In a full implementation, this would call a session API
      const sessionId = Date.now().toString()
      setSessionId(sessionId)
      setSessionStartTime(Date.now())
    } catch (error) {
      console.error('Failed to start study session:', error)
    }
  }

  const loadFlashcards = async () => {
    setIsLoading(true)
    try {
      let cards: FlashcardWithProgress[]
      if (noteId) {
        cards = await flashcardService.getFlashcardsByNoteId(noteId)
      } else {
        // Use optimal batch sizing for spaced repetition
        cards = await flashcardService.getFlashcardsForReview()
      }
      setFlashcards(cards)
      if (cards.length === 0) {
        setIsCompleted(true)
      }
    } catch (error) {
      console.error('Failed to load flashcards:', error)
      setFlashcards([])
      setIsCompleted(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFlip = () => {
    if (!isFlipped) {
      setCardStartTime(Date.now())
    }
    setIsFlipped(!isFlipped)
  }

  const handleResponse = async (difficulty: 'easy' | 'hard') => {
    if (!currentCard) return

    const responseTime = cardStartTime ? Date.now() - cardStartTime : 0
    
    // Record the review
    await flashcardService.recordReview(currentCard.id, difficulty, responseTime)
    
    // Update stats
    const newStats = {
      correct: reviewStats.correct + (difficulty === 'easy' ? 1 : 0),
      total: reviewStats.total + 1
    }
    setReviewStats(newStats)
    
    // Move to next card
    if (currentIndex + 1 >= flashcards.length) {
      setIsCompleted(true)
      onComplete?.(newStats)
    } else {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setStartTime(0)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setReviewStats({ correct: 0, total: 0 })
    setIsCompleted(false)
    setCardStartTime(0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-mango-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (isCompleted || flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="card p-8">
            {flashcards.length === 0 ? (
              <>
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-2xl font-bold text-white mb-4">No Flashcards Available</h2>
                <p className="text-gray-400 mb-6">
                  {noteId 
                    ? "This note doesn't have any flashcards yet."
                    : "You don't have any flashcards ready for review."}
                </p>
                <button
                  onClick={onExit}
                  className="btn-secondary w-full"
                >
                  Go Back
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-4">Review Complete!</h2>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-mango-500 mb-2">
                    {reviewStats.correct}/{reviewStats.total}
                  </div>
                  <p className="text-gray-400">
                    {Math.round((reviewStats.correct / reviewStats.total) * 100)}% correct
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRestart}
                    className="btn-secondary flex-1"
                  >
                    Review Again
                  </button>
                  <button
                    onClick={onExit}
                    className="btn-primary flex-1"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="glass-effect border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Flashcard Review</h1>
              <p className="text-sm text-gray-400">
                {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              <span className="text-green-400">{reviewStats.correct}</span>
              {' / '}
              <span className="text-gray-400">{reviewStats.total}</span>
            </div>
            <div className="w-32 bg-gray-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-mango-500 to-mango-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex) / flashcards.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="max-w-2xl w-full">
          <div 
            className={`card p-8 min-h-80 cursor-pointer transition-all duration-300 hover:shadow-2xl ${
              isFlipped ? 'bg-gradient-to-br from-mango-500/10 to-mango-400/5' : ''
            }`}
            onClick={handleFlip}
          >
            <div className="text-center h-full flex flex-col justify-center">
              <div className="mb-6">
                <div className={`text-sm font-medium mb-4 ${
                  isFlipped ? 'text-mango-400' : 'text-gray-400'
                }`}>
                  {isFlipped ? 'ANSWER' : 'QUESTION'}
                </div>
                <div className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                  {isFlipped ? currentCard.answer : currentCard.question}
                </div>
              </div>
              
              {!isFlipped && (
                <div className="text-gray-500 text-sm">
                  Click to reveal answer
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isFlipped && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleResponse('hard')}
                className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 py-4 px-6 rounded-xl hover:bg-red-500/30 transition-colors font-medium"
              >
                <div className="text-2xl mb-1">😰</div>
                Hard
              </button>
              <button
                onClick={() => handleResponse('easy')}
                className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 py-4 px-6 rounded-xl hover:bg-green-500/30 transition-colors font-medium"
              >
                <div className="text-2xl mb-1">😊</div>
                Easy
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 text-center text-sm text-gray-500">
            {!isFlipped ? (
              "Click the card to see the answer"
            ) : (
              "Rate your performance on this card"
            )}
          </div>
        </div>
      </div>
    </div>
  )
}