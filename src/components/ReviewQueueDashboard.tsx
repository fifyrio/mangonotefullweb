'use client'

import { useState, useEffect } from 'react'
import { FlashcardClientService, ReviewStats } from '@/lib/flashcard-client-service'
import FlashcardReview from './FlashcardReview'

interface ReviewQueueDashboardProps {
  onStartReview?: () => void
  className?: string
}

export default function ReviewQueueDashboard({ onStartReview, className }: ReviewQueueDashboardProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const flashcardService = new FlashcardClientService()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const reviewStats = await flashcardService.getReviewStats()
      setStats(reviewStats)
    } catch (error) {
      console.error('Failed to load review stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadStats()
    setIsRefreshing(false)
  }

  const handleStartReview = () => {
    setShowReview(true)
    onStartReview?.()
  }

  const handleReviewComplete = async (reviewStats: { correct: number; total: number; sessionId?: string }) => {
    setShowReview(false)
    // Refresh stats after review
    await loadStats()
  }

  const handleReviewExit = () => {
    setShowReview(false)
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-400'
    if (rate >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getReviewButtonClass = (cardsDue: number) => {
    const baseClass = 'btn-primary w-full flex items-center justify-center gap-2'
    return cardsDue === 0 ? `${baseClass} opacity-50 cursor-not-allowed` : baseClass
  }

  if (showReview) {
    return (
      <FlashcardReview
        onComplete={handleReviewComplete}
        onExit={handleReviewExit}
      />
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Review Queue</h2>
          <p className="text-gray-400 mt-2">
            Spaced repetition learning system powered by SM-2 algorithm
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <svg 
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-3 w-3/4"></div>
              <div className="h-8 bg-gray-700 rounded mb-2 w-1/2"></div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cards Due */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <p className="text-sm text-gray-400 mb-1">Cards Due</p>
                <p className="text-3xl font-bold text-red-400 mb-2">{stats.cards_due}</p>
                <p className="text-xs text-gray-500">
                  {stats.cards_due > 0 ? 'Ready for review' : 'All caught up! 🎉'}
                </p>
              </div>
            </div>

            {/* New Cards */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <p className="text-sm text-gray-400 mb-1">New Cards</p>
                <p className="text-3xl font-bold text-blue-400 mb-2">{stats.new_cards}</p>
                <p className="text-xs text-gray-500">Never studied</p>
              </div>
            </div>

            {/* Learning Cards */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <p className="text-sm text-gray-400 mb-1">Learning</p>
                <p className="text-3xl font-bold text-yellow-400 mb-2">{stats.learning_cards}</p>
                <p className="text-xs text-gray-500">Being learned</p>
              </div>
            </div>

            {/* Mastered Cards */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <p className="text-sm text-gray-400 mb-1">Mastered</p>
                <p className="text-3xl font-bold text-green-400 mb-2">{stats.cards_mastered}</p>
                <p className="text-xs text-gray-500">Long intervals</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Today's Progress</h3>
                <div className="text-2xl">📊</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Reviews Today</span>
                  <span className="text-white font-medium">{stats.reviews_today}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Streak</span>
                  <span className="text-mango-400 font-medium">{stats.current_streak} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Reviews</span>
                  <span className="text-white font-medium">{stats.total_reviews.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Learning Analytics</h3>
                <div className="text-2xl">🧠</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Retention Rate</span>
                  <span className={`font-medium ${getRetentionColor(stats.retention_rate)}`}>
                    {(stats.retention_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg. Easiness</span>
                  <span className="text-white font-medium">{stats.average_easiness_factor.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Review Cards</span>
                  <span className="text-white font-medium">{stats.review_cards}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                <div className="text-2xl">⚡</div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleStartReview}
                  disabled={stats.cards_due === 0}
                  className={getReviewButtonClass(stats.cards_due)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Review ({stats.cards_due})
                </button>
                
                {stats.cards_due === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    All cards reviewed! Check back later for more.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Learning Algorithm Info */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🔬</div>
              <div>
                <h3 className="text-lg font-semibold text-white">Spaced Repetition Algorithm</h3>
                <p className="text-sm text-gray-400">Powered by SuperMemo-2 (SM-2) for optimal learning intervals</p>
              </div>
            </div>
            
            <div className="bg-dark-secondary rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-mango-400 font-medium mb-1">How it works:</div>
                  <ul className="text-gray-400 space-y-1">
                    <li>• Cards you find easy get longer intervals</li>
                    <li>• Difficult cards are reviewed more frequently</li>
                    <li>• Optimal timing for maximum retention</li>
                  </ul>
                </div>
                
                <div>
                  <div className="text-mango-400 font-medium mb-1">Performance Scale:</div>
                  <ul className="text-gray-400 space-y-1">
                    <li>• <span className="text-green-400">Easy</span>: Quick recall (Quality 4-5)</li>
                    <li>• <span className="text-red-400">Hard</span>: Struggled/Incorrect (Quality 0-2)</li>
                    <li>• Intervals adapt to your performance</li>
                  </ul>
                </div>
                
                <div>
                  <div className="text-mango-400 font-medium mb-1">Learning Stages:</div>
                  <ul className="text-gray-400 space-y-1">
                    <li>• <span className="text-blue-400">New</span>: First time learning</li>
                    <li>• <span className="text-yellow-400">Learning</span>: Building familiarity</li>
                    <li>• <span className="text-green-400">Mastered</span>: Long-term retention</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-6 opacity-30">📊</div>
          <h3 className="text-xl text-gray-400 mb-4">No Review Data</h3>
          <p className="text-gray-500">
            Start studying some flashcards to see your spaced repetition statistics.
          </p>
        </div>
      )}
    </div>
  )
}