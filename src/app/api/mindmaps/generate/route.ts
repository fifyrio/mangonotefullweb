import { NextRequest, NextResponse } from 'next/server'
import { MindMapService } from '@/lib/mindmap-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, note_id } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'Content too short for mind map generation (minimum 50 characters)' },
        { status: 400 }
      )
    }

    console.log('Generating mind map...', { 
      contentLength: content.length,
      noteId: note_id 
    })

    const mindMapService = new MindMapService()
    const mindMap = await mindMapService.generateMindMap(content, note_id)

    console.log('Mind map generated successfully:', {
      id: mindMap.id,
      title: mindMap.title,
      nodeCount: mindMap.nodes.length,
      edgeCount: mindMap.edges.length
    })

    return NextResponse.json({
      success: true,
      data: mindMap
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'mindmap_generate', {
      contentLength: (await request.json().catch(() => ({})))?.content?.length
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}