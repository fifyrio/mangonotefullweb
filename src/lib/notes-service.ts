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
}