import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '@/lib/database'
import { AIService } from '@/lib/ai-service'

// For demo purposes, we'll use a mock user ID
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('audio') as File
    const folderId = formData.get('folderId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Audio file is required' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { success: false, error: 'Only audio files are allowed' },
        { status: 400 }
      )
    }

    // Size limit: 25MB for audio files
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Audio file size must be less than 25MB' },
        { status: 400 }
      )
    }

    console.log('Processing audio upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: DEMO_USER_ID
    })

    // Upload file to Vercel Blob Storage
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'mp3'
    const blobFileName = `${DEMO_USER_ID}/audio/${timestamp}-${file.name}`
    
    const blob = await put(blobFileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('Audio file uploaded to Blob Storage:', {
      url: blob.url,
      size: file.size
    })

    // For now, we'll create a placeholder transcription
    // In production, you would integrate with a speech-to-text service
    const placeholderTranscription = `[Audio file uploaded: ${file.name}]\n\nThis is a placeholder transcription. In production, this would be replaced with actual speech-to-text processing using services like:\n- OpenAI Whisper API\n- Google Cloud Speech-to-Text\n- Azure Speech Services\n- AWS Transcribe`

    // Create note in database
    const noteId = uuidv4()
    const noteTitle = file.name.replace(/\.(mp3|wav|ogg|flac|aac|wma|aiff)$/i, '')

    await query(`
      INSERT INTO notes (id, user_id, title, source_type, folder_id, content_status, transcription, url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      noteId,
      DEMO_USER_ID,
      noteTitle,
      'audio',
      folderId || null,
      'completed',
      placeholderTranscription,
      blob.url
    ])

    // Create a basic content block for audio notes
    const blockId = uuidv4()
    await query(`
      INSERT INTO content_blocks (id, note_id, type, icon, icon_color, title, content, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      blockId,
      noteId,
      'text',
      '🎵',
      '#FFC300',
      'Audio Transcription',
      JSON.stringify({
        text: placeholderTranscription,
        audioUrl: blob.url,
        fileName: file.name,
        fileSize: file.size,
        duration: null // Could be extracted with audio analysis
      }),
      0
    ])

    // Get the created note
    const note = await queryOne(`
      SELECT * FROM notes WHERE id = $1
    `, [noteId])

    console.log('Successfully processed audio upload and created note:', {
      noteId,
      title: noteTitle,
      fileSize: file.size,
      blobUrl: blob.url
    })

    return NextResponse.json({
      success: true,
      data: {
        note,
        content_blocks: [{
          id: blockId,
          note_id: noteId,
          type: 'text',
          icon: '🎵',
          icon_color: '#FFC300',
          title: 'Audio Transcription',
          content: {
            text: placeholderTranscription,
            audioUrl: blob.url,
            fileName: file.name,
            fileSize: file.size,
            duration: null
          },
          sort_order: 0
        }],
        audio_metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          blobUrl: blob.url
        }
      }
    })

  } catch (error) {
    console.error('Failed to process audio upload:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process audio file' 
      },
      { status: 500 }
    )
  }
}