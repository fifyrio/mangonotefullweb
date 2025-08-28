'use client'

import Sidebar from '@/components/Sidebar'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('summary')
  const noteId = params.id as string

  const tabs = [
    { id: 'summary', name: 'Summary & Notes', active: activeTab === 'summary' },
    { id: 'mindmap', name: 'Mind Map', active: activeTab === 'mindmap' },
    { id: 'flashcards', name: 'Flashcards', active: activeTab === 'flashcards' },
    { id: 'quiz', name: 'Quiz', active: activeTab === 'quiz' }
  ]

  const summaryContent = {
    title: 'The Future of Work',
    summary: 'The future of work is being shaped by rapid technological advancements, shifting demographics, and evolving societal expectations. Automation and artificial intelligence are transforming job roles, requiring workers to adapt and acquire new skills. The rise of the gig economy and remote work is blurring traditional employment boundaries, offering flexibility but also presenting challenges in terms of job security and benefits. As organizations embrace digital transformation, they must prioritize employee well-being, foster inclusive cultures, and invest in continuous learning and development to thrive in the changing landscape.',
    notes: [
      {
        title: 'Key takeaway 1:',
        content: 'Lifelong learning is no longer a choice but a necessity.'
      },
      {
        title: 'Key takeaway 2:',
        content: 'Soft skills like emotional intelligence and creativity are becoming more valuable.'
      },
      {
        title: 'Question for further research:',
        content: 'How can companies ensure fair compensation and benefits for gig workers?'
      }
    ],
    personalNote: 'This reminds me of the industrial revolution and how society had to adapt to new technologies. The pace of change seems much faster now.'
  }

  return (
    <div className="min-h-screen bg-dark-primary flex">
      <Sidebar className="w-80 shrink-0" />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-dark-secondary border-b border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{summaryContent.title}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rename
              </button>
              <button className="text-red-400 hover:text-red-300 px-4 py-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-8">
          {/* Tabs */}
          <div className="border-b border-gray-700 mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tab.active
                      ? 'border-mango-500 text-mango-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'summary' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Summary</h2>
                <p className="text-gray-300 leading-relaxed">
                  {summaryContent.summary}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-6">My Notes</h2>
                <div className="space-y-4">
                  {summaryContent.notes.map((note, index) => (
                    <div key={index} className="bg-dark-tertiary p-4 rounded-lg">
                      <p className="text-mango-500 font-medium mb-2">{note.title}</p>
                      <p className="text-gray-300">{note.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-dark-tertiary p-4 rounded-lg">
                  <p className="text-gray-300 italic">"{summaryContent.personalNote}"</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mindmap' && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">🧠</div>
                <h3 className="text-xl font-bold text-white mb-4">Interactive Mind Map</h3>
                <p className="text-gray-400 mb-6">
                  Visualize concepts and their relationships in an interactive mind map generated from your note content.
                </p>
                <Link
                  href={`/notes/${noteId}/mindmap`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <span>🧠</span>
                  Open Mind Map
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">🎴</div>
                <h3 className="text-xl font-bold text-white mb-4">Study Flashcards</h3>
                <p className="text-gray-400 mb-6">
                  Review and practice with AI-generated flashcards from your note content.
                </p>
                <Link
                  href={`/notes/${noteId}/flashcards`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <span>🎴</span>
                  Start Review
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">Quiz functionality coming soon...</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}