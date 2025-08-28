import { NextRequest, NextResponse } from 'next/server'
import { NotesService } from '@/lib/notes-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    const notesService = new NotesService()
    const notes = await notesService.getRecentNotes(limit)

    return NextResponse.json({
      success: true,
      data: notes
    })
  } catch (error) {
    ErrorHandler.logError(error as Error, 'recent_notes_fetch')
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}