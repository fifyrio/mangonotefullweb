import { NextRequest, NextResponse } from 'next/server'
import { NotesService } from '@/lib/notes-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const notesService = new NotesService()
    const note = await notesService.getNoteById(noteId)

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: note
    })
  } catch (error) {
    ErrorHandler.logError(error as Error, 'note_fetch', { noteId: params.id })
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}