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
      <Sidebar className="w-80 shrink-0" isLoggedIn={false} />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="glass-effect border-b border-white/5 px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-medium">All notes</span>
            <span className="opacity-50">/</span>
            <span className="text-mango-400 font-medium">My notes</span>
          </div>
        </div>

        <div className="p-10">
          {/* New note section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gradient mb-10">New note</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {noteCreationOptions.map((option) => (
                <button
                  key={option.title}
                  onClick={() => setActiveModal(option.modalType)}
                  className="card p-8 group relative overflow-hidden"
                >
                  <div className="text-center relative z-10">
                    <div className={`text-5xl mb-6 ${option.color} group-hover:scale-125 transition-all duration-500 drop-shadow-lg`}>
                      {option.icon}
                    </div>
                    <h3 className="text-white font-bold mb-3 text-lg group-hover:text-mango-400 transition-colors duration-300">{option.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{option.description}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ))}
            </div>
          </div>

          {/* My notes section */}
          <div>
            <h2 className="text-4xl font-bold text-gradient mb-10">My notes</h2>
            
            <div className="space-y-6">
              {recentNotes.map((note) => (
                <Link
                  key={note.title}
                  href={note.href}
                  className="block card p-8 group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-3 group-hover:text-mango-400 transition-colors duration-300">
                        {note.title}
                      </h3>
                      <p className="text-gray-400 text-base mb-4 line-clamp-2 leading-relaxed">
                        {note.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-mango-500 rounded-full"></div>
                        <p className="text-gray-500 text-sm font-medium">
                          {note.date}
                        </p>
                      </div>
                    </div>
                    <div className="ml-8 text-gray-400 group-hover:text-mango-400 transition-all duration-300 transform group-hover:translate-x-2">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-mango-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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