'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MindMapViewer from '@/components/MindMapViewer'
import { MindMapData } from '@/lib/mindmap-types'
// Removed direct database import to avoid build issues

export default function NoteMindMapPage() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string

  const [mindMap, setMindMap] = useState<MindMapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState<string>('')

  useEffect(() => {
    loadMindMap()
    loadNoteTitle()
  }, [noteId])

  const loadNoteTitle = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setNoteTitle(result.data.title)
        }
      }
    } catch (error) {
      console.error('Failed to load note title:', error)
    }
  }

  const loadMindMap = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/mindmaps/note/${noteId}`)
      
      if (response.ok) {
        const result = await response.json()
        setMindMap(result.data)
      } else if (response.status === 404) {
        // Mind map doesn't exist yet
        setMindMap(null)
      } else {
        throw new Error('Failed to load mind map')
      }
    } catch (error) {
      console.error('Error loading mind map:', error)
      setError('Failed to load mind map')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMindMap = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      // Get note content first
      const noteResponse = await fetch(`/api/notes/${noteId}`)
      if (!noteResponse.ok) {
        throw new Error('Failed to load note data')
      }
      
      const noteResult = await noteResponse.json()
      const note = noteResult.data
      
      if (!note || !note.transcription) {
        throw new Error('No content available to generate mind map')
      }

      const response = await fetch('/api/mindmaps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: note.transcription,
          note_id: noteId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate mind map')
      }

      const result = await response.json()
      setMindMap(result.data)
    } catch (error) {
      console.error('Error generating mind map:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate mind map')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async (updatedMindMap: MindMapData) => {
    if (!mindMap) return

    try {
      const response = await fetch(`/api/mindmaps/${mindMap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedMindMap)
      })

      if (response.ok) {
        const result = await response.json()
        setMindMap(result.data)
        console.log('Mind map saved successfully')
      } else {
        throw new Error('Failed to save mind map')
      }
    } catch (error) {
      console.error('Error saving mind map:', error)
    }
  }

  const handleBack = () => {
    router.push(`/notes/${noteId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="glass-effect border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="h-6 bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-32 mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-mango-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading mind map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="glass-effect border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Mind Map</h1>
              <p className="text-sm text-gray-400">{noteTitle}</p>
            </div>
          </div>
          
          {!mindMap && (
            <button
              onClick={generateMindMap}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <span>🧠</span>
                  Generate Mind Map
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)]">
        {error && (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div>
                  <h3 className="text-red-400 font-medium">Error</h3>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mindMap ? (
          <MindMapViewer 
            mindMapData={mindMap}
            onSave={handleSave}
            isEditable={true}
            className="h-full"
          />
        ) : !isGenerating && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">🧠</div>
              <h2 className="text-2xl font-bold text-white mb-4">No Mind Map Yet</h2>
              <p className="text-gray-400 mb-6">
                Generate a visual mind map from your note content to better understand concepts and their relationships.
              </p>
              <button
                onClick={generateMindMap}
                className="btn-primary"
              >
                <span>🧠</span>
                Generate Mind Map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}