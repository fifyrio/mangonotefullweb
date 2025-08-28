import { query, queryOne } from '@/lib/database'

// For demo purposes, we'll use a mock user ID
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export interface Note {
  id: string
  user_id: string
  title: string
  source_type: 'import' | 'recording' | 'manual' | 'youtube'
  content_status: 'pending' | 'processing' | 'completed' | 'failed'
  transcription?: string
  url?: string
  created_at: string
  updated_at: string
}

export interface NoteSummary extends Note {
  content_blocks_count: number
  flashcards_count: number
  preview: string
}

export interface CreateNoteParams {
  title: string
  userId: string
  folderId?: string | null
  sourceType: 'pdf' | 'audio' | 'youtube' | 'text'
  transcription?: string
  audioUrl?: string | null
  url?: string
  imageUrl?: string
  contentStatus?: 'processing' | 'completed' | 'failed' | 'draft'
}

export interface CreateContentBlockParams {
  noteId: string
  type: string
  title: string
  content: any
  icon?: string
  iconColor?: string
  sortOrder?: number
}

export interface ContentBlock {
  id: string
  note_id: string
  type: string
  title: string
  content: any
  icon?: string
  icon_color?: string
  sort_order: number
}

export class NotesService {
  /**
   * Get recent notes for dashboard
   */
  async getRecentNotes(limit: number = 10): Promise<NoteSummary[]> {
    try {
      const notes = await query(`
        SELECT 
          n.*,
          COALESCE(cb_count.count, 0) as content_blocks_count,
          COALESCE(fc_count.count, 0) as flashcards_count,
          COALESCE(SUBSTRING(n.transcription, 1, 200), '') as preview
        FROM notes n
        LEFT JOIN (
          SELECT note_id, COUNT(*) as count 
          FROM content_blocks 
          GROUP BY note_id
        ) cb_count ON n.id = cb_count.note_id
        LEFT JOIN (
          SELECT note_id, COUNT(*) as count 
          FROM flashcards 
          GROUP BY note_id
        ) fc_count ON n.id = fc_count.note_id
        WHERE n.user_id = $1 
        AND n.content_status = 'completed'
        ORDER BY n.updated_at DESC 
        LIMIT $2
      `, [DEMO_USER_ID, limit])

      return (notes as unknown as any[]).map(note => ({
        ...note,
        preview: note.preview || 'No content available'
      }))
    } catch (error) {
      console.error('Failed to fetch recent notes:', error)
      return []
    }
  }

  /**
   * Get all notes with search and filtering
   */
  async getAllNotes(searchQuery?: string, sourceType?: string): Promise<NoteSummary[]> {
    try {
      let whereClause = 'WHERE n.user_id = $1 AND n.content_status = $2'
      const params: any[] = [DEMO_USER_ID, 'completed']
      let paramIndex = 3

      if (searchQuery) {
        whereClause += ` AND (n.title ILIKE $${paramIndex} OR n.transcription ILIKE $${paramIndex})`
        params.push(`%${searchQuery}%`)
        paramIndex++
      }

      if (sourceType) {
        whereClause += ` AND n.source_type = $${paramIndex}`
        params.push(sourceType)
      }

      const notes = await query(`
        SELECT 
          n.*,
          COALESCE(cb_count.count, 0) as content_blocks_count,
          COALESCE(fc_count.count, 0) as flashcards_count,
          COALESCE(SUBSTRING(n.transcription, 1, 200), '') as preview
        FROM notes n
        LEFT JOIN (
          SELECT note_id, COUNT(*) as count 
          FROM content_blocks 
          GROUP BY note_id
        ) cb_count ON n.id = cb_count.note_id
        LEFT JOIN (
          SELECT note_id, COUNT(*) as count 
          FROM flashcards 
          GROUP BY note_id
        ) fc_count ON n.id = fc_count.note_id
        ${whereClause}
        ORDER BY n.updated_at DESC
      `, params)

      return (notes as unknown as any[]).map(note => ({
        ...note,
        preview: note.preview || 'No content available'
      }))
    } catch (error) {
      console.error('Failed to fetch all notes:', error)
      return []
    }
  }

  /**
   * Get note by ID with full details
   */
  async getNoteById(noteId: string): Promise<Note | null> {
    try {
      const note = await queryOne(`
        SELECT * FROM notes 
        WHERE id = $1 AND user_id = $2
      `, [noteId, DEMO_USER_ID])

      return note || null
    } catch (error) {
      console.error('Failed to fetch note by ID:', error)
      return null
    }
  }

  /**
   * Get notes statistics for dashboard
   */
  async getNotesStats(): Promise<{
    total_notes: number
    total_flashcards: number
    notes_this_week: number
    study_streak: number
  }> {
    try {
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total_notes,
          COALESCE(SUM(
            (SELECT COUNT(*) FROM flashcards WHERE note_id = notes.id)
          ), 0) as total_flashcards,
          COALESCE(SUM(
            CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END
          ), 0) as notes_this_week
        FROM notes 
        WHERE user_id = $1 AND content_status = 'completed'
      `, [DEMO_USER_ID])

      // TODO: Implement actual study streak calculation
      const study_streak = 0

      const stats = (statsResult as unknown as any[])[0]
      return {
        total_notes: parseInt(stats?.total_notes || '0'),
        total_flashcards: parseInt(stats?.total_flashcards || '0'),
        notes_this_week: parseInt(stats?.notes_this_week || '0'),
        study_streak
      }
    } catch (error) {
      console.error('Failed to fetch notes stats:', error)
      return {
        total_notes: 0,
        total_flashcards: 0,
        notes_this_week: 0,
        study_streak: 0
      }
    }
  }

  /**
   * Delete note and related content
   */
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      // Start transaction
      await query('BEGIN')

      // Delete in order: flashcards, content_blocks, then note
      await query('DELETE FROM flashcards WHERE note_id = $1', [noteId])
      await query('DELETE FROM content_blocks WHERE note_id = $1', [noteId])
      const result = await query(
        'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id', 
        [noteId, DEMO_USER_ID]
      )

      await query('COMMIT')
      
      return (result as unknown as any[]).length > 0
    } catch (error) {
      await query('ROLLBACK')
      console.error('Failed to delete note:', error)
      return false
    }
  }

  /**
   * Create a new note
   */
  async createNote(params: CreateNoteParams): Promise<Note> {
    try {
      const result = await query(`
        INSERT INTO notes (
          title, user_id, folder_id, source_type, 
          transcription, url, image_url, content_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        params.title,
        params.userId,
        params.folderId || null,
        params.sourceType,
        params.transcription || null,
        params.url || null,
        params.imageUrl || null,
        params.contentStatus || 'completed'
      ])

      const notes = result as unknown as any[]
      if (notes.length === 0) {
        throw new Error('Failed to create note')
      }

      return {
        id: notes[0].id,
        user_id: notes[0].user_id,
        title: notes[0].title,
        source_type: notes[0].source_type,
        content_status: notes[0].content_status,
        transcription: notes[0].transcription,
        url: notes[0].url,
        created_at: notes[0].created_at,
        updated_at: notes[0].updated_at
      }
    } catch (error) {
      console.error('Failed to create note:', error)
      throw new Error('Failed to create note')
    }
  }

  /**
   * Create a content block for a note
   */
  async createContentBlock(params: CreateContentBlockParams): Promise<ContentBlock> {
    try {
      const result = await query(`
        INSERT INTO content_blocks (
          note_id, type, title, content, icon, icon_color, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        params.noteId,
        params.type,
        params.title,
        JSON.stringify(params.content),
        params.icon || null,
        params.iconColor || null,
        params.sortOrder || 0
      ])

      const blocks = result as unknown as any[]
      if (blocks.length === 0) {
        throw new Error('Failed to create content block')
      }

      const block = blocks[0]
      return {
        id: block.id,
        note_id: block.note_id,
        type: block.type,
        title: block.title,
        content: typeof block.content === 'string' ? JSON.parse(block.content) : block.content,
        icon: block.icon,
        icon_color: block.icon_color,
        sort_order: block.sort_order || 0
      }
    } catch (error) {
      console.error('Failed to create content block:', error)
      throw new Error('Failed to create content block')
    }
  }

  /**
   * Get content blocks for a note
   */
  async getContentBlocks(noteId: string): Promise<ContentBlock[]> {
    try {
      const result = await query(`
        SELECT * FROM content_blocks 
        WHERE note_id = $1 
        ORDER BY sort_order ASC
      `, [noteId])

      const blocks = result as unknown as any[]
      return blocks.map(block => ({
        id: block.id,
        note_id: block.note_id,
        type: block.type,
        title: block.title,
        content: typeof block.content === 'string' ? JSON.parse(block.content) : block.content,
        icon: block.icon,
        icon_color: block.icon_color,
        sort_order: block.sort_order || 0
      }))
    } catch (error) {
      console.error('Failed to get content blocks:', error)
      return []
    }
  }
}

// Export singleton instance
export const notesService = new NotesService();