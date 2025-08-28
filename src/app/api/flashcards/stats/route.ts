import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcard-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const flashcardService = new FlashcardService()
    const stats = await flashcardService.getReviewStats()

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'flashcard_stats_get', {})
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}