import { NextRequest, NextResponse } from 'next/server'
import { MindMapService } from '@/lib/mindmap-service'
import { ErrorHandler } from '@/lib/error-handler'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mind map ID is required' },
        { status: 400 }
      )
    }

    const mindMapService = new MindMapService()
    const mindMap = await mindMapService.getMindMapById(id)

    if (!mindMap) {
      return NextResponse.json(
        { success: false, error: 'Mind map not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: mindMap
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'mindmap_get', {
      mindMapId: (await params).id
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Mind map ID is required' },
        { status: 400 }
      )
    }

    const mindMapService = new MindMapService()
    const updatedMindMap = await mindMapService.updateMindMap(id, body)

    if (!updatedMindMap) {
      return NextResponse.json(
        { success: false, error: 'Mind map not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedMindMap
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'mindmap_update', {
      mindMapId: (await params).id
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}