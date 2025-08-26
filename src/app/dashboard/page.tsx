'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import RecordAudioModal from '@/components/modals/RecordAudioModal'
import UploadAudioModal from '@/components/modals/UploadAudioModal'
import UploadPDFModal from '@/components/modals/UploadPDFModal'
import YoutubeVideoModal from '@/components/modals/YoutubeVideoModal'

export default function DashboardPage() {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const noteCreationOptions = [
    {
      icon: '🎤',
      title: 'Record audio',
      description: 'Record voice memo',
      modalType: 'record-audio',
      color: 'text-red-400'
    },
    {
      icon: '📁',
      title: 'Upload audio',
      description: 'Upload audio file',
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

  const handleFileGenerate = (fileOrNoteId: File | Blob | string) => {
    // For PDF uploads, this will be a noteId, for others it's still a file
    if (typeof fileOrNoteId === 'string') {
      // Navigate directly to the created note
      router.push(`/notes/${fileOrNoteId}`)
    } else {
      // For other file types, navigate to processing page
      console.log('Generating note from:', fileOrNoteId)
      router.push('/processing')
    }
  }

  const recentNotes = [
    {
      title: 'Welcome to Mango AI...',
      description: 'This is a quick tutorial to get you started with Mango AI. You can use Mango AI to take notes, summarize lectures, and more. It\'s designed to be intuitive and powerful.',
      date: '10 Nov 2024, 02:08 AM',
      href: '/notes/1'
    },
    {
      title: 'Quantum Mechanics Lecture',
      description: 'A deep dive into the principles of quantum superposition and entanglement. The lecture covered key experiments and their implications for modern physics and computing.',
      date: '08 Nov 2024, 11:34 AM',
      href: '/notes/2'
    }
  ]

  return (
    <div className="min-h-screen bg-dark-primary flex">
      <Sidebar className="w-80 shrink-0" />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-dark-secondary border-b border-gray-700 px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>All notes</span>
            <span>/</span>
            <span>My notes</span>
          </div>
        </div>

        <div className="p-8">
          {/* New note section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8">New note</h2>
            
            <div className="grid grid-cols-4 gap-6">
              {noteCreationOptions.map((option) => (
                <button
                  key={option.title}
                  onClick={() => setActiveModal(option.modalType)}
                  className="bg-dark-tertiary hover:bg-dark-surface p-6 rounded-xl border border-gray-700 transition-colors group"
                >
                  <div className="text-center">
                    <div className={`text-4xl mb-4 ${option.color} group-hover:scale-110 transition-transform`}>
                      {option.icon}
                    </div>
                    <h3 className="text-white font-semibold mb-2">{option.title}</h3>
                    <p className="text-gray-400 text-sm">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* My notes section */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-8">My notes</h2>
            
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <Link
                  key={note.title}
                  href={note.href}
                  className="block bg-dark-tertiary hover:bg-dark-surface p-6 rounded-xl border border-gray-700 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-mango-500 transition-colors">
                        {note.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {note.description}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {note.date}
                      </p>
                    </div>
                    <div className="ml-4 text-gray-400 group-hover:text-mango-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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