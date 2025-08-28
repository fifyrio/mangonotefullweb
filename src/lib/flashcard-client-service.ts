/**
 * Client-side Flashcard Service
 * Uses API routes instead of direct database access to avoid build issues
 */

export interface FlashcardWithProgress {
  id: string
  note_id: string
  user_id: string
  question: string
  answer: string
  created_at: string
  review_count: number
  last_reviewed: string | null
  difficulty_average: number
  // Spaced repetition data
  repetitions?: number
  easiness_factor?: number
  interval_days?: number
  next_review_date?: string
  is_new?: boolean
  priority?: 'overdue' | 'due' | 'upcoming'
  days_since_last_review?: number
}

export interface ReviewStats {
  total_reviews: number
  reviews_today: number
  cards_mastered: number
  current_streak: number
  cards_due: number
  new_cards: number
  learning_cards: number
  review_cards: number
  retention_rate: number
  average_easiness_factor: number
}

export class FlashcardClientService {
  /**
   * Get flashcards for review (uses spaced repetition)
   */
  async getFlashcardsForReview(noteId?: string): Promise<FlashcardWithProgress[]> {
    try {
      const url = new URL('/api/flashcards/review-queue', window.location.origin)
      if (noteId) {
        url.searchParams.append('noteId', noteId)
      }

      const response = await fetch(url.toString())
      const result = await response.json()

      if (result.success) {
        return result.data.flashcards
      } else {
        throw new Error(result.error || 'Failed to load flashcards')
      }
    } catch (error) {
      console.error('Failed to fetch flashcards for review:', error)
      return []
    }
  }

  /**
   * Record a flashcard review
   */
  async recordReview(
    flashcardId: string, 
    difficulty: 'easy' | 'hard', 
    responseTimeMs: number = 0
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flashcardId,
          difficulty,
          responseTimeMs
        }),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Failed to record review:', error)
      return false
    }
  }

  /**
   * Get comprehensive review statistics
   */
  async getReviewStats(): Promise<ReviewStats> {
    try {
      const response = await fetch('/api/flashcards/review-stats')
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to load review stats')
      }
    } catch (error) {
      console.error('Failed to fetch review stats:', error)
      return {
        total_reviews: 0,
        reviews_today: 0,
        cards_mastered: 0,
        current_streak: 0,
        cards_due: 0,
        new_cards: 0,
        learning_cards: 0,
        review_cards: 0,
        retention_rate: 0,
        average_easiness_factor: 2.5
      }
    }
  }

  /**
   * Get flashcards for a specific note
   */
  async getFlashcardsByNoteId(noteId: string): Promise<FlashcardWithProgress[]> {
    try {
      const response = await fetch(`/api/flashcards/${noteId}`)
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to load note flashcards')
      }
    } catch (error) {
      console.error('Failed to fetch note flashcards:', error)
      return []
    }
  }
}