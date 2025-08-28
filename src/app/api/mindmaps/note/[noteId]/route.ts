import { NextRequest, NextResponse } from 'next/server'
import { MindMapService } from '@/lib/mindmap-service'
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

    const mindMapService = new MindMapService()
    const mindMap = await mindMapService.getMindMapByNoteId(noteId)

    if (!mindMap) {
      return NextResponse.json(
        { success: false, error: 'Mind map not found for this note' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: mindMap
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'mindmap_get_by_note', {
      noteId: (await params).noteId
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}