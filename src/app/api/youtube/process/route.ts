import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { query } from '@/lib/database'
import { YouTubeTranscriptService } from '@/lib/youtube-transcript-service'
import { AIService } from '@/lib/ai-service'
import { ErrorHandler } from '@/lib/error-handler'

// For demo purposes, we'll use a mock user ID
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, language, folderId } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    console.log('Processing YouTube video:', {
      url,
      language: language || 'auto',
      folderId
    })

    // Step 1: 获取字幕
    const transcriptService = new YouTubeTranscriptService()
    const transcriptResult = await transcriptService.getTranscript(url, language)

    if (!transcriptResult.fullText || transcriptResult.fullText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No transcript text available from this video' },
        { status: 400 }
      )
    }

    // 检查字幕长度限制
    if (transcriptResult.fullText.length > 50000) {
      return NextResponse.json(
        { success: false, error: 'Video transcript is too long (max 50,000 characters)' },
        { status: 400 }
      )
    }

    // Step 2: AI 分析内容
    let aiService: AIService
    let analysisResult: any[]
    
    try {
      aiService = new AIService()
      analysisResult = await aiService.analyzeContent(transcriptResult.fullText)
    } catch (aiError) {
      ErrorHandler.logError(aiError as Error, 'youtube_ai_analysis', {
        url,
        textLength: transcriptResult.fullText.length
      })
      
      // Return AI error response
      const errorResponse = ErrorHandler.createErrorResponse(aiError as Error)
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Step 3: 获取标题
    const titleItem = analysisResult.find((item) => item.type === 'title')
    let noteTitle = titleItem?.content?.title || 'YouTube Video Notes'
    
    // 如果没有AI生成的标题，尝试从URL提取
    if (noteTitle === 'YouTube Video Notes') {
      const videoId = transcriptService.extractVideoId(url)
      if (videoId) {
        noteTitle = `YouTube Video ${videoId}`
      }
    }

    // Step 4: 创建笔记记录
    const noteId = uuidv4()
    await query(`
      INSERT INTO notes (id, user_id, title, source_type, folder_id, content_status, transcription, url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      noteId,
      DEMO_USER_ID,
      noteTitle,
      'youtube',
      folderId || null,
      'completed',
      transcriptResult.fullText.substring(0, 10000), // Store first 10k chars as transcription
      url
    ])

    // Step 5: 创建内容块 (exclude title type)
    const contentBlocks = analysisResult.filter((item) => item.type !== 'title')
    const createdContentBlocks = []

    for (let i = 0; i < contentBlocks.length; i++) {
      const block = contentBlocks[i]
      const blockId = uuidv4()
      
      await query(`
        INSERT INTO content_blocks (id, note_id, type, icon, icon_color, title, content, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        blockId,
        noteId,
        block.type,
        block.icon || null,
        block.icon_color || null,
        block.title,
        JSON.stringify(block.content),
        block.sort_order || i
      ])

      createdContentBlocks.push({
        id: blockId,
        note_id: noteId,
        type: block.type,
        icon: block.icon,
        icon_color: block.icon_color,
        title: block.title,
        content: block.content,
        sort_order: block.sort_order || i
      })
    }

    // Step 6: 生成和存储闪卡
    let flashcards: any[] = []
    try {
      const generatedFlashcards = await aiService.generateFlashcards(transcriptResult.fullText)
      if (generatedFlashcards && generatedFlashcards.length > 0) {
        for (const flashcard of generatedFlashcards) {
          const flashcardId = uuidv4()
          await query(`
            INSERT INTO flashcards (id, note_id, user_id, question, answer, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `, [
            flashcardId,
            noteId,
            DEMO_USER_ID,
            flashcard.question,
            flashcard.answer
          ])

          flashcards.push({
            id: flashcardId,
            note_id: noteId,
            user_id: DEMO_USER_ID,
            question: flashcard.question,
            answer: flashcard.answer
          })
        }
      }
    } catch (flashcardError) {
      console.error('Failed to generate flashcards:', flashcardError)
      // Don't fail the entire process if flashcard generation fails
    }

    // Step 7: 获取创建的笔记
    const noteRows = await query(`
      SELECT * FROM notes WHERE id = $1
    `, [noteId])

    console.log('Successfully processed YouTube video:', {
      noteId,
      title: noteTitle,
      url,
      videoId: transcriptResult.videoId,
      language: transcriptResult.language,
      duration: transcriptResult.duration,
      textLength: transcriptResult.fullText.length,
      contentBlocksCount: createdContentBlocks.length,
      flashcardsCount: flashcards.length
    })

    return NextResponse.json({
      success: true,
      data: {
        note: (noteRows as unknown as any[])[0],
        content_blocks: createdContentBlocks,
        analysis: analysisResult,
        flashcards,
        transcript: {
          videoId: transcriptResult.videoId,
          language: transcriptResult.language,
          availableLanguages: transcriptResult.availableLanguages,
          duration: transcriptResult.duration,
          formattedDuration: transcriptService.formatTimestamp(transcriptResult.duration),
          textLength: transcriptResult.fullText.length,
          segmentCount: transcriptResult.transcript.length
        },
        youtube_metadata: {
          url,
          videoId: transcriptResult.videoId,
          language: transcriptResult.language,
          duration: transcriptResult.duration
        }
      }
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'youtube_process', {
      url: (await request.json().catch(() => ({})))?.url
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}