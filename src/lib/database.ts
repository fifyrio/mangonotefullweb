import { Pool } from 'pg'

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/mangonoteweb',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export { pool }

// Database types based on schema
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: Date
  updated_at: Date
  is_guest: boolean
  last_active_at: Date
}

export interface Note {
  id: string
  user_id: string
  folder_id?: string
  title: string
  source_type: string
  content_status: string
  created_at: Date
  updated_at: Date
  url?: string
  transcription?: string
  image_url?: string
  markdown?: string
}

export interface ContentBlock {
  id: string
  note_id: string
  type: string
  icon?: string
  icon_color?: string
  title: string
  content: any
  sort_order: number
}

export interface Flashcard {
  id: string
  note_id: string
  user_id: string
  question: string
  answer: string
  created_at: Date
}

export interface Folder {
  id: string
  user_id: string
  name: string
  color?: string
  icon?: string
  created_at: Date
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper function to get a single row
export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params)
  return result.rows[0]
}

// Helper function to get multiple rows
export async function queryMany(text: string, params?: any[]) {
  const result = await query(text, params)
  return result.rows
}