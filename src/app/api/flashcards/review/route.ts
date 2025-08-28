import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcard-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flashcardId, difficulty, responseTimeMs } = body

    if (!flashcardId || !difficulty) {
      return NextResponse.json(
        { success: false, error: 'flashcardId and difficulty are required' },
        { status: 400 }
      )
    }

    if (!['easy', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'difficulty must be "easy" or "hard"' },
        { status: 400 }
      )
    }

    const flashcardService = new FlashcardService()
    const success = await flashcardService.recordReview(
      flashcardId,
      difficulty,
      responseTimeMs || 0
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Review recorded successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to record review' },
        { status: 500 }
      )
    }
  } catch (error) {
    ErrorHandler.logError(error as Error, 'flashcard_review')
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}