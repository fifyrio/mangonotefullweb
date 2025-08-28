import { NextRequest, NextResponse } from 'next/server'
import { FlashcardService } from '@/lib/flashcard-service'
import { ErrorHandler } from '@/lib/error-handler'

interface Props {
  params: Promise<{ noteId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { noteId } = await params
    
    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const flashcardService = new FlashcardService()
    const flashcards = await flashcardService.getFlashcardsByNoteId(noteId)

    return NextResponse.json({
      success: true,
      data: {
        flashcards,
        count: flashcards.length
      }
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'flashcards_get', {
      noteId: (await params).noteId
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}