import { query, queryOne } from '@/lib/database'
import { SpacedRepetitionEngine, SpacedRepetitionData, ReviewSession, ReviewQueueItem } from '@/lib/spaced-repetition-engine'

// For demo purposes, we'll use a mock user ID
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export interface Flashcard {
  id: string
  note_id: string
  user_id: string
  question: string
  answer: string
  created_at: string
}

export interface FlashcardReview {
  id: string
  flashcard_id: string
  user_id: string
  difficulty: 'easy' | 'hard'
  response_time_ms: number
  created_at: string
}

export interface FlashcardWithProgress extends Flashcard {
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

export interface CreateFlashcardParams {
  noteId: string
  userId: string
  question: string
  answer: string
}

export class FlashcardService {
  private spacedRepetitionEngine: SpacedRepetitionEngine

  constructor() {
    this.spacedRepetitionEngine = new SpacedRepetitionEngine()
  }

  /**
   * Get flashcards for a specific note
   */
  async getFlashcardsByNoteId(noteId: string): Promise<FlashcardWithProgress[]> {
    try {
      const flashcards = await query(`
        SELECT 
          f.*,
          COALESCE(r.review_count, 0) as review_count,
          r.last_reviewed,
          COALESCE(r.difficulty_average, 0) as difficulty_average
        FROM flashcards f
        LEFT JOIN (
          SELECT 
            flashcard_id,
            COUNT(*) as review_count,
            MAX(created_at) as last_reviewed,
            AVG(CASE WHEN difficulty = 'easy' THEN 1.0 ELSE 0.0 END) as difficulty_average
          FROM flashcard_reviews 
          WHERE user_id = $1
          GROUP BY flashcard_id
        ) r ON f.id = r.flashcard_id
        WHERE f.note_id = $2 AND f.user_id = $1
        ORDER BY f.created_at ASC
      `, [DEMO_USER_ID, noteId])

      return flashcards as unknown as FlashcardWithProgress[]
    } catch (error) {
      console.error('Failed to fetch flashcards:', error)
      return []
    }
  }

  /**
   * Get flashcards ready for review using spaced repetition
   */
  async getFlashcardsForReview(limit: number = 20): Promise<FlashcardWithProgress[]> {
    try {
      // Use the database view for due flashcards
      const dueFlashcards = await query(`
        SELECT *
        FROM due_flashcards
        WHERE user_id = $1
        ORDER BY 
          CASE priority
            WHEN 'overdue' THEN 1
            WHEN 'due' THEN 2
            ELSE 3
          END,
          days_since_last_review DESC,
          next_review_date ASC
        LIMIT $2
      `, [DEMO_USER_ID, limit])

      // Transform to FlashcardWithProgress format
      return (dueFlashcards as unknown as any[]).map((card: any) => ({
        id: card.flashcard_id,
        note_id: card.note_id,
        user_id: card.user_id,
        question: card.question,
        answer: card.answer,
        created_at: card.created_at,
        review_count: card.repetitions || 0,
        last_reviewed: card.last_reviewed_at,
        difficulty_average: card.easiness_factor || 2.5,
        // Spaced repetition specific
        repetitions: card.repetitions,
        easiness_factor: card.easiness_factor,
        interval_days: card.interval_days,
        next_review_date: card.next_review_date,
        is_new: card.is_new,
        priority: card.priority,
        days_since_last_review: card.days_since_last_review
      }))
    } catch (error) {
      console.error('Failed to fetch review flashcards:', error)
      return []
    }
  }

  /**
   * Record a flashcard review using spaced repetition algorithm
   */
  async recordReview(
    flashcardId: string, 
    difficulty: 'easy' | 'hard', 
    responseTimeMs: number = 0
  ): Promise<boolean> {
    try {
      // Convert difficulty to SM-2 quality score
      const quality = this.spacedRepetitionEngine.convertToQualityScore(difficulty === 'easy', responseTimeMs)
      
      // Get current spaced repetition data
      const currentDataResult = await query(`
        SELECT * FROM spaced_repetition 
        WHERE flashcard_id = $1 AND user_id = $2
      `, [flashcardId, DEMO_USER_ID])

      const currentData = (currentDataResult as unknown as any[])[0]
      let spacedRepData: SpacedRepetitionData
      
      if (!currentData) {
        // Initialize new flashcard for spaced repetition
        spacedRepData = this.spacedRepetitionEngine.initializeFlashcard(flashcardId, DEMO_USER_ID)
        await query(`
          INSERT INTO spaced_repetition 
          (flashcard_id, user_id, repetitions, easiness_factor, interval_days, next_review_date, is_new)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          flashcardId, DEMO_USER_ID, spacedRepData.repetitions, 
          spacedRepData.easinessFactor, spacedRepData.interval,
          spacedRepData.nextReviewDate, spacedRepData.isNew
        ])
      } else {
        // Convert database record to SpacedRepetitionData
        spacedRepData = {
          flashcardId: currentData.flashcard_id,
          userId: currentData.user_id,
          repetitions: currentData.repetitions,
          easinessFactor: parseFloat(currentData.easiness_factor),
          interval: currentData.interval_days,
          nextReviewDate: new Date(currentData.next_review_date),
          lastReviewedAt: currentData.last_reviewed_at ? new Date(currentData.last_reviewed_at) : null,
          lastQuality: currentData.last_quality,
          isNew: currentData.is_new
        }
      }

      // Store review session with before state
      const beforeState = { ...spacedRepData }
      
      // Process review with SM-2 algorithm
      const updatedData = this.spacedRepetitionEngine.processReview(spacedRepData, quality)
      
      // Update spaced repetition data
      await query(`
        UPDATE spaced_repetition 
        SET repetitions = $3, easiness_factor = $4, interval_days = $5, 
            next_review_date = $6, last_reviewed_at = $7, last_quality = $8, 
            is_new = $9, updated_at = CURRENT_TIMESTAMP
        WHERE flashcard_id = $1 AND user_id = $2
      `, [
        flashcardId, DEMO_USER_ID, updatedData.repetitions,
        updatedData.easinessFactor, updatedData.interval,
        updatedData.nextReviewDate, updatedData.lastReviewedAt,
        updatedData.lastQuality, updatedData.isNew
      ])

      // Record detailed review session
      await query(`
        INSERT INTO review_sessions 
        (flashcard_id, user_id, quality, response_time_ms, 
         before_repetitions, before_easiness_factor, before_interval,
         after_repetitions, after_easiness_factor, after_interval)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        flashcardId, DEMO_USER_ID, quality, responseTimeMs,
        beforeState.repetitions, beforeState.easinessFactor, beforeState.interval,
        updatedData.repetitions, updatedData.easinessFactor, updatedData.interval
      ])

      // Also record in legacy flashcard_reviews for compatibility
      await query(`
        INSERT INTO flashcard_reviews (flashcard_id, user_id, difficulty, response_time_ms)
        VALUES ($1, $2, $3, $4)
      `, [flashcardId, DEMO_USER_ID, difficulty, responseTimeMs])
      
      return true
    } catch (error) {
      console.error('Failed to record review:', error)
      return false
    }
  }

  /**
   * Get comprehensive review statistics using spaced repetition data
   */
  async getReviewStats(): Promise<{
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
  }> {
    try {
      // Get learning stats from the view
      const learningStatsResult = await query(`
        SELECT * FROM user_learning_stats WHERE user_id = $1
      `, [DEMO_USER_ID])
      const learningStats = (learningStatsResult as unknown as any[])[0]

      // Get review session stats
      const sessionStatsResult = await query(`
        SELECT 
          COUNT(*) as total_reviews,
          COALESCE(SUM(
            CASE WHEN DATE(reviewed_at) = CURRENT_DATE THEN 1 ELSE 0 END
          ), 0) as reviews_today
        FROM review_sessions 
        WHERE user_id = $1
      `, [DEMO_USER_ID])
      const sessionStats = (sessionStatsResult as unknown as any[])[0]

      // Calculate streak (consecutive days with reviews)
      const streakQuery = await query(`
        WITH daily_reviews AS (
          SELECT DATE(reviewed_at) as review_date
          FROM review_sessions 
          WHERE user_id = $1
          GROUP BY DATE(reviewed_at)
          ORDER BY DATE(reviewed_at) DESC
        ),
        streak_calc AS (
          SELECT 
            review_date,
            ROW_NUMBER() OVER (ORDER BY review_date DESC) as rn,
            review_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY review_date DESC) - 1) as expected_date
          FROM daily_reviews
        )
        SELECT COUNT(*) as current_streak
        FROM streak_calc
        WHERE expected_date = (SELECT MAX(review_date) FROM daily_reviews) - INTERVAL '1 day' * (rn - 1)
      `, [DEMO_USER_ID])

      const currentStreak = ((streakQuery as unknown as any[])[0])?.current_streak || 0

      return {
        total_reviews: parseInt(sessionStats?.total_reviews || '0'),
        reviews_today: parseInt(sessionStats?.reviews_today || '0'),
        cards_mastered: parseInt(learningStats?.mastered_cards || '0'),
        current_streak: parseInt(currentStreak),
        cards_due: parseInt(learningStats?.cards_due_now || '0'),
        new_cards: parseInt(learningStats?.new_cards || '0'),
        learning_cards: parseInt(learningStats?.learning_cards || '0'),
        review_cards: parseInt(learningStats?.review_cards || '0'),
        retention_rate: parseFloat(learningStats?.retention_rate || '0'),
        average_easiness_factor: parseFloat(learningStats?.average_easiness_factor || '2.5')
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
   * Get flashcard by ID
   */
  async getFlashcardById(flashcardId: string): Promise<FlashcardWithProgress | null> {
    try {
      const flashcardResult = await query(`
        SELECT 
          f.*,
          COALESCE(r.review_count, 0) as review_count,
          r.last_reviewed,
          COALESCE(r.difficulty_average, 0) as difficulty_average
        FROM flashcards f
        LEFT JOIN (
          SELECT 
            flashcard_id,
            COUNT(*) as review_count,
            MAX(created_at) as last_reviewed,
            AVG(CASE WHEN difficulty = 'easy' THEN 1.0 ELSE 0.0 END) as difficulty_average
          FROM flashcard_reviews 
          WHERE user_id = $1
          GROUP BY flashcard_id
        ) r ON f.id = r.flashcard_id
        WHERE f.id = $2 AND f.user_id = $1
      `, [DEMO_USER_ID, flashcardId])

      const flashcard = (flashcardResult as unknown as any[])[0]
      return flashcard || null
    } catch (error) {
      console.error('Failed to fetch flashcard by ID:', error)
      return null
    }
  }

  /**
   * Initialize spaced repetition for existing flashcards
   */
  async initializeSpacedRepetitionForNote(noteId: string): Promise<void> {
    try {
      const flashcards = await query(`
        SELECT id FROM flashcards WHERE note_id = $1 AND user_id = $2
      `, [noteId, DEMO_USER_ID])

      for (const flashcard of (flashcards as unknown as any[])) {
        await query(`
          SELECT initialize_spaced_repetition_for_flashcard($1, $2)
        `, [flashcard.id, DEMO_USER_ID])
      }
    } catch (error) {
      console.error('Failed to initialize spaced repetition:', error)
    }
  }

  /**
   * Get optimal review batch for user
   */
  async getOptimalReviewBatch(): Promise<FlashcardWithProgress[]> {
    try {
      const stats = await this.getReviewStats()
      const optimalSize = this.spacedRepetitionEngine.getOptimalBatchSize(stats.cards_due)
      
      return await this.getFlashcardsForReview(optimalSize)
    } catch (error) {
      console.error('Failed to get optimal review batch:', error)
      return []
    }
  }

  /**
   * Start a new study session
   */
  async startStudySession(noteId?: string): Promise<string> {
    try {
      const sessionResult = await query(`
        INSERT INTO study_sessions (user_id, session_type, note_id, started_at)
        VALUES ($1, 'review', $2, CURRENT_TIMESTAMP)
        RETURNING id
      `, [DEMO_USER_ID, noteId || null])
      
      const session = (sessionResult as unknown as any[])[0]
      return session.id
    } catch (error) {
      console.error('Failed to start study session:', error)
      throw error
    }
  }

  /**
   * Complete a study session
   */
  async completeStudySession(
    sessionId: string, 
    cardsReviewed: number, 
    cardsCorrect: number, 
    totalTimeMs: number
  ): Promise<void> {
    try {
      await query(`
        UPDATE study_sessions 
        SET completed_at = CURRENT_TIMESTAMP, 
            cards_reviewed = $2, 
            cards_correct = $3, 
            total_time_ms = $4,
            retention_rate = $3::DECIMAL / NULLIF($2, 0)
        WHERE id = $1
      `, [sessionId, cardsReviewed, cardsCorrect, totalTimeMs])
    } catch (error) {
      console.error('Failed to complete study session:', error)
    }
  }

  /**
   * Create a new flashcard
   */
  async createFlashcard(params: CreateFlashcardParams): Promise<Flashcard> {
    try {
      const result = await query(`
        INSERT INTO flashcards (note_id, user_id, question, answer)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [params.noteId, params.userId, params.question, params.answer])

      const flashcards = result as unknown as any[]
      if (flashcards.length === 0) {
        throw new Error('Failed to create flashcard')
      }

      const flashcard = flashcards[0]
      return {
        id: flashcard.id,
        note_id: flashcard.note_id,
        user_id: flashcard.user_id,
        question: flashcard.question,
        answer: flashcard.answer,
        created_at: flashcard.created_at
      }
    } catch (error) {
      console.error('Failed to create flashcard:', error)
      throw new Error('Failed to create flashcard')
    }
  }

  /**
   * Initialize spaced repetition tracking for a flashcard
   */
  async initializeSpacedRepetition(flashcardId: string, userId: string): Promise<void> {
    try {
      await query(`
        INSERT INTO spaced_repetition (
          flashcard_id, user_id, repetitions, easiness_factor, 
          interval_days, next_review_date, is_new
        ) VALUES ($1, $2, 0, 2.5, 1, CURRENT_TIMESTAMP, TRUE)
        ON CONFLICT (flashcard_id, user_id) DO NOTHING
      `, [flashcardId, userId])
    } catch (error) {
      console.error('Failed to initialize spaced repetition:', error)
      throw new Error('Failed to initialize spaced repetition')
    }
  }
}

// Export singleton instance
export const flashcardService = new FlashcardService();