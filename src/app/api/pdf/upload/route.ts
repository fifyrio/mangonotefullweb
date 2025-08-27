import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '@/lib/database'
import { AIService } from '@/lib/ai-service'
import { ErrorHandler } from '@/lib/error-handler'

// For demo purposes, we'll use a mock user ID
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File
    const folderId = formData.get('folderId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'PDF file is required' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    console.log('Processing PDF upload:', {
      fileName: file.name,
      fileSize: file.size,
      userId: DEMO_USER_ID
    })

    // Upload file to Vercel Blob Storage
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'pdf'
    const blobFileName = `${DEMO_USER_ID}/${timestamp}-${file.name}`
    
    const blob = await put(blobFileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('File uploaded to Blob Storage:', {
      url: blob.url,
      size: file.size
    })

    // Convert file to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer())

    // Extract text from PDF - dynamically import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    const pdfData = await pdfParse(buffer)
    const extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from PDF' },
        { status: 400 }
      )
    }

    if (extractedText.length > 50000) {
      return NextResponse.json(
        { success: false, error: 'PDF content is too large (max 50,000 characters)' },
        { status: 400 }
      )
    }

    // Analyze content with AI
    let aiService: AIService
    let analysisResult: any[]
    
    try {
      aiService = new AIService()
      analysisResult = await aiService.analyzeContent(extractedText)
    } catch (aiError) {
      ErrorHandler.logError(aiError as Error, 'pdf_upload_ai_analysis', {
        fileName: file.name,
        textLength: extractedText.length
      })
      
      // Return AI error response
      const errorResponse = ErrorHandler.createErrorResponse(aiError as Error)
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Get title for the note
    const titleItem = analysisResult.find((item) => item.type === 'title')
    const noteTitle = titleItem?.content?.title || file.name.replace('.pdf', '')

    // Create note in database
    const noteId = uuidv4()
    await query(`
      INSERT INTO notes (id, user_id, title, source_type, folder_id, content_status, transcription, url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      noteId,
      DEMO_USER_ID,
      noteTitle,
      'import',
      folderId || null,
      'completed',
      extractedText.substring(0, 10000), // Store first 10k chars as transcription
      blob.url
    ])

    // Create content blocks (exclude title type)
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

    // Generate and store flashcards
    let flashcards: any[] = []
    try {
      const generatedFlashcards = await aiService.generateFlashcards(extractedText)
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
    }

    // Get the created note
    const note = await queryOne(`
      SELECT * FROM notes WHERE id = $1
    `, [noteId])

    console.log('Successfully processed PDF and created note:', {
      noteId,
      title: noteTitle,
      textLength: extractedText.length,
      contentBlocksCount: createdContentBlocks.length,
      flashcardsCount: flashcards.length
    })

    return NextResponse.json({
      success: true,
      data: {
        note,
        content_blocks: createdContentBlocks,
        analysis: analysisResult,
        flashcards,
        extracted_text_preview: extractedText.substring(0, 500),
        pdf_metadata: {
          fileName: file.name,
          fileSize: file.size,
          textLength: extractedText.length,
          blobUrl: blob.url
        }
      }
    })

  } catch (error) {
    ErrorHandler.logError(error as Error, 'pdf_upload', {
      fileName: file?.name,
      fileSize: file?.size
    })
    
    const errorResponse = ErrorHandler.createErrorResponse(error as Error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}