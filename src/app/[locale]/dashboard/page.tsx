'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
// NoteSummary interface
interface NoteSummary {
  id: string
  title: string
  preview: string
  updated_at: string
  content_blocks_count: number
  flashcards_count: number
  source_type: string
}
import RecordAudioModal from '@/components/modals/RecordAudioModal'
import UploadAudioModal from '@/components/modals/UploadAudioModal'
import UploadPDFModal from '@/components/modals/UploadPDFModal'
import YoutubeVideoModal from '@/components/modals/YoutubeVideoModal'

export default function DashboardPage() {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [recentNotes, setRecentNotes] = useState<NoteSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Removed direct database service
  const noteCreationOptions = [
    {
      icon: '🎤',
      title: 'Record audio',
      description: 'Record voice memo',
      modalType: 'record-audio',
      color: 'text-red-400'
    },
    {
      icon: '🎵',
      title: 'Upload audio',
      description: 'AI-powered transcription',
      modalType: 'upload-audio',
      color: 'text-mango-500'
    },
    {
      icon: '📄',
      title: 'Upload PDF',
      description: 'Upload PDF document',
      modalType: 'upload-pdf',
      color: 'text-orange-400'
    },
    {
      icon: '▶️',
      title: 'YouTube Video',
      description: 'Paste YouTube URL',
      modalType: 'youtube-video',
      color: 'text-yellow-400'
    }
  ]

  // Load recent notes on component mount
  useEffect(() => {
    const loadRecentNotes = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/notes/recent?limit=6')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setRecentNotes(result.data)
          } else {
            setRecentNotes([])
          }
        } else {
          setRecentNotes([])
        }
      } catch (error) {
        console.error('Failed to load recent notes:', error)
        setRecentNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    loadRecentNotes()
  }, [])

  const handleFileGenerate = (fileOrNoteId: File | Blob | string) => {
    // For PDF uploads and YouTube videos, this will be a noteId, for others it's still a file
    if (typeof fileOrNoteId === 'string') {
      // Navigate directly to the created note
      router.push(`/notes/${fileOrNoteId}`)
      // Refresh notes list
      loadRecentNotes()
    } else {
      // For other file types, navigate to processing page
      console.log('Generating note from:', fileOrNoteId)
      router.push('/processing')
    }
  }

  const loadRecentNotes = async () => {
    try {
      const response = await fetch('/api/notes/recent?limit=6')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRecentNotes(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to refresh notes:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-surface flex">
      <Sidebar className="w-80 shrink-0" />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-surface-elevated border-b border-border-light px-8 py-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-medium">All notes</span>
            <span className="opacity-50">/</span>
            <span className="text-mango-secondary font-medium">My notes</span>
          </div>
        </div>

        <div className="p-10">
          {/* New note section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gradient-mango mb-10">New note</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {noteCreationOptions.map((option) => (
                <button
                  key={option.title}
                  onClick={() => setActiveModal(option.modalType)}
                  className="card card-interactive p-8 group relative overflow-hidden"
                >
                  <div className="text-center relative z-10">
                    <div className={`text-5xl mb-6 ${option.color} group-hover:scale-125 transition-all duration-500 drop-shadow-lg`}>
                      {option.icon}
                    </div>
                    <h3 className="text-text-primary font-bold mb-3 text-lg group-hover:text-mango-secondary transition-colors duration-300">{option.title}</h3>
                    <p className="text-text-muted text-sm leading-relaxed">{option.description}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-mango-primary/5 to-mango-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ))}
            </div>
          </div>

          {/* My notes section */}
          <div>
            <h2 className="text-4xl font-bold text-gradient-mango mb-10">My notes</h2>
            
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-8 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-6 bg-border-medium rounded mb-3 w-3/4"></div>
                        <div className="h-4 bg-border-medium rounded mb-2 w-full"></div>
                        <div className="h-4 bg-border-medium rounded mb-4 w-2/3"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-border-medium rounded-full"></div>
                          <div className="h-3 bg-border-medium rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-6">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="block card card-interactive p-8 group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex-1">
                        <h3 className="text-text-primary font-bold text-xl mb-3 group-hover:text-mango-secondary transition-colors duration-300">
                          {note.title}
                        </h3>
                        <p className="text-text-muted text-base mb-4 line-clamp-2 leading-relaxed">
                          {note.preview}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-mango-primary rounded-full"></div>
                              <p className="text-text-muted text-sm font-medium">
                                {formatDate(note.updated_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-text-muted">
                              <span>📄 {note.content_blocks_count} blocks</span>
                              <span>🎴 {note.flashcards_count} cards</span>
                            </div>
                          </div>
                          <div className="text-xs text-text-muted bg-surface-tertiary px-2 py-1 rounded">
                            {note.source_type}
                          </div>
                        </div>
                      </div>
                      <div className="ml-8 text-text-muted group-hover:text-mango-secondary transition-all duration-300 transform group-hover:translate-x-2">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-mango-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-6 opacity-30">📝</div>
                <h3 className="text-xl text-text-secondary mb-4">No notes yet</h3>
                <p className="text-text-muted mb-6">
                  Upload a PDF, record audio, or create your first note to get started.
                </p>
                <button
                  onClick={() => setActiveModal('upload-pdf')}
                  className="btn-primary"
                >
                  Create Your First Note
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <RecordAudioModal
        isOpen={activeModal === 'record-audio'}
        onClose={() => setActiveModal(null)}
        onGenerate={handleFileGenerate}
      />
      <UploadAudioModal
        isOpen={activeModal === 'upload-audio'}
        onClose={() => setActiveModal(null)}
        onGenerate={handleFileGenerate}
      />
      <UploadPDFModal
        isOpen={activeModal === 'upload-pdf'}
        onClose={() => setActiveModal(null)}
        onGenerate={handleFileGenerate}
      />
      <YoutubeVideoModal
        isOpen={activeModal === 'youtube-video'}
        onClose={() => setActiveModal(null)}
        onGenerate={handleFileGenerate}
      />
    </div>
  )
}