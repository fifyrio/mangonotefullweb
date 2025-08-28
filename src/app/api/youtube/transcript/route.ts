import { NextRequest, NextResponse } from 'next/server'
import { YouTubeTranscriptService } from '@/lib/youtube-transcript-service'
import { ErrorHandler } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, language } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    console.log('Fetching YouTube transcript...', { 
      url,
      language: language || 'auto'
    })

    const transcriptService = new YouTubeTranscriptService()
    const result = await transcriptService.getTranscript(url, language)

    console.log('YouTube transcript fetched successfully:', {
      videoId: result.videoId,
      language: result.language,
      textLength: result.fullText.length,
      duration: result.duration,
      transcriptItems: result.transcript.length
    })

    return NextResponse.json({
      success: true,
      data: {
        videoId: result.videoId,
        language: result.language,
        availableLanguages: result.availableLanguages,
        transcript: result.transcript,
        fullText: result.fullText,
        duration: result.duration,
        formattedDuration: transcriptService.formatTimestamp(result.duration)
      }
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'youtube_transcript_api', {
      url: (await request.json().catch(() => ({})))?.url
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const language = searchParams.get('language')

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    const transcriptService = new YouTubeTranscriptService()

    // 如果请求的是可用语言列表
    if (searchParams.get('action') === 'languages') {
      const languages = await transcriptService.getAvailableLanguages(url)
      return NextResponse.json({
        success: true,
        data: { availableLanguages: languages }
      })
    }

    // 获取完整字幕
    const result = await transcriptService.getTranscript(url, language || undefined)

    return NextResponse.json({
      success: true,
      data: {
        videoId: result.videoId,
        language: result.language,
        availableLanguages: result.availableLanguages,
        transcript: result.transcript,
        fullText: result.fullText,
        duration: result.duration,
        formattedDuration: transcriptService.formatTimestamp(result.duration)
      }
    })

  } catch (error) {
    const { searchParams } = new URL(request.url)
    ErrorHandler.logError(error as Error, 'youtube_transcript_get', {
      url: searchParams.get('url')
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}