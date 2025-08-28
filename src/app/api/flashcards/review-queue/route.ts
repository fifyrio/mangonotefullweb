import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcard-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const flashcardService = new FlashcardService()
    
    let flashcards
    if (noteId) {
      flashcards = await flashcardService.getFlashcardsByNoteId(noteId)
    } else {
      flashcards = await flashcardService.getOptimalReviewBatch()
    }
    
    return NextResponse.json({
      success: true,
      data: {
        flashcards,
        count: flashcards.length
      }
    })
  } catch (error) {
    ErrorHandler.logError(error as Error, 'flashcard_review_queue')
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}