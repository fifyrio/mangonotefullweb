/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on SuperMemo-2 algorithm for optimal learning intervals
 */

export interface ReviewSession {
  flashcardId: string
  userId: string
  quality: number // 0-5 scale (0: complete blackout, 5: perfect response)
  responseTime?: number // Optional: time taken to answer in milliseconds
  reviewedAt: Date
}

export interface SpacedRepetitionData {
  flashcardId: string
  userId: string
  repetitions: number // Number of times reviewed
  easinessFactor: number // Easiness factor (1.3 - 2.5+)
  interval: number // Days until next review
  nextReviewDate: Date
  lastReviewedAt: Date | null
  lastQuality: number | null
  isNew: boolean
}

export interface ReviewQueueItem {
  flashcardId: string
  noteId: string
  question: string
  answer: string
  nextReviewDate: Date
  priority: 'overdue' | 'due' | 'upcoming'
  daysSinceLastReview: number
}

export class SpacedRepetitionEngine {
  
  /**
   * Process a review session using SM-2 algorithm
   * @param currentData Current spaced repetition data for the flashcard
   * @param quality Quality of response (0-5)
   * @returns Updated spaced repetition data
   */
  processReview(currentData: SpacedRepetitionData, quality: number): SpacedRepetitionData {
    // Validate quality input
    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be between 0 and 5')
    }

    const now = new Date()
    let { repetitions, easinessFactor, interval } = currentData

    // If quality < 3, restart the learning process
    if (quality < 3) {
      repetitions = 0
      interval = 1
    } else {
      // Successful review - increment repetitions
      repetitions++

      // Calculate new interval based on SM-2 algorithm
      if (repetitions === 1) {
        interval = 1
      } else if (repetitions === 2) {
        interval = 6
      } else {
        interval = Math.round(interval * easinessFactor)
      }
    }

    // Update easiness factor based on quality
    easinessFactor = Math.max(
      1.3,
      easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )

    // Calculate next review date
    const nextReviewDate = new Date(now)
    nextReviewDate.setDate(nextReviewDate.getDate() + interval)

    return {
      ...currentData,
      repetitions,
      easinessFactor,
      interval,
      nextReviewDate,
      lastReviewedAt: now,
      lastQuality: quality,
      isNew: false
    }
  }

  /**
   * Create initial spaced repetition data for a new flashcard
   */
  initializeFlashcard(flashcardId: string, userId: string): SpacedRepetitionData {
    return {
      flashcardId,
      userId,
      repetitions: 0,
      easinessFactor: 2.5, // Default easiness factor
      interval: 1, // Start with 1 day
      nextReviewDate: new Date(), // Available for immediate review
      lastReviewedAt: null,
      lastQuality: null,
      isNew: true
    }
  }

  /**
   * Get review priority based on how overdue the flashcard is
   */
  getReviewPriority(nextReviewDate: Date): 'overdue' | 'due' | 'upcoming' {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const reviewDate = new Date(nextReviewDate.getFullYear(), nextReviewDate.getMonth(), nextReviewDate.getDate())

    if (reviewDate < today) {
      return 'overdue'
    } else if (reviewDate.getTime() === today.getTime()) {
      return 'due'
    } else {
      return 'upcoming'
    }
  }

  /**
   * Calculate days since last review
   */
  getDaysSinceLastReview(lastReviewedAt: Date | null): number {
    if (!lastReviewedAt) return 0

    const now = new Date()
    const diffTime = now.getTime() - lastReviewedAt.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Convert quality score from simple Easy/Hard to SM-2 quality scale
   * @param isEasy true for "Easy" button, false for "Hard" button
   * @param responseTime optional response time in milliseconds
   */
  convertToQualityScore(isEasy: boolean, responseTime?: number): number {
    if (isEasy) {
      // Easy responses get quality 4-5 based on response time
      if (responseTime && responseTime < 3000) { // Less than 3 seconds
        return 5 // Perfect response
      }
      return 4 // Correct response with some hesitation
    } else {
      // Hard responses get quality 2-3 (still correct but difficult)
      return 2 // Incorrect response, but remembered with serious difficulty
    }
  }

  /**
   * Get optimal batch size for review sessions
   */
  getOptimalBatchSize(totalDue: number): number {
    // Cognitive research suggests 10-20 cards per session for optimal retention
    if (totalDue <= 10) return totalDue
    if (totalDue <= 50) return 15
    if (totalDue <= 100) return 20
    return 25 // Cap at 25 for longer sessions
  }

  /**
   * Sort review queue by priority and learning efficiency
   */
  sortReviewQueue(queue: ReviewQueueItem[]): ReviewQueueItem[] {
    return queue.sort((a, b) => {
      // Priority order: overdue > due > upcoming
      const priorityOrder = { 'overdue': 0, 'due': 1, 'upcoming': 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Within same priority, sort by days since last review (older first)
      return b.daysSinceLastReview - a.daysSinceLastReview
    })
  }

  /**
   * Calculate learning statistics
   */
  calculateLearningStats(spacedRepetitionData: SpacedRepetitionData[]): {
    totalCards: number
    newCards: number
    learningCards: number
    reviewCards: number
    masteredCards: number
    averageEasinessFactor: number
    retentionRate: number
  } {
    const totalCards = spacedRepetitionData.length
    let newCards = 0
    let learningCards = 0
    let reviewCards = 0
    let masteredCards = 0
    let totalEF = 0
    let successfulReviews = 0

    spacedRepetitionData.forEach(data => {
      totalEF += data.easinessFactor

      if (data.isNew) {
        newCards++
      } else if (data.repetitions < 2) {
        learningCards++
      } else if (data.interval >= 21) { // Mastered after 3+ weeks interval
        masteredCards++
      } else {
        reviewCards++
      }

      if (data.lastQuality !== null && data.lastQuality >= 3) {
        successfulReviews++
      }
    })

    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      masteredCards,
      averageEasinessFactor: totalCards > 0 ? totalEF / totalCards : 2.5,
      retentionRate: totalCards > 0 ? successfulReviews / totalCards : 0
    }
  }
}