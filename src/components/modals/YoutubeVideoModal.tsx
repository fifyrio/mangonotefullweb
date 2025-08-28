'use client'

import { useState, useEffect } from 'react'
import { YouTubeTranscriptService } from '@/lib/youtube-transcript-service'

interface YoutubeVideoModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (noteId: string) => void
}

export default function YoutubeVideoModal({ isOpen, onClose, onGenerate }: YoutubeVideoModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setYoutubeUrl('')
      setSelectedLanguage('')
      setAvailableLanguages([])
      setError(null)
      setIsProcessing(false)
      setIsLoadingLanguages(false)
    }
  }, [isOpen])

  // Load available languages when URL is valid
  useEffect(() => {
    const loadLanguages = async () => {
      if (!youtubeUrl.trim() || !isValidYoutubeUrl(youtubeUrl)) {
        setAvailableLanguages([])
        return
      }

      setIsLoadingLanguages(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}&action=languages`)
        const result = await response.json()
        
        if (result.success) {
          setAvailableLanguages(result.data.availableLanguages || [])
        } else {
          throw new Error(result.error || 'Failed to load available languages')
        }
      } catch (error) {
        console.error('Error loading languages:', error)
        // Don't show error for language loading, just keep empty array
        setAvailableLanguages([])
      } finally {
        setIsLoadingLanguages(false)
      }
    }

    // Debounce the API call
    const timeoutId = setTimeout(loadLanguages, 1000)
    return () => clearTimeout(timeoutId)
  }, [youtubeUrl])

  const handleGenerate = async () => {
    if (!youtubeUrl.trim() || !isValidYoutubeUrl(youtubeUrl)) return

    setIsProcessing(true)
    setError(null)

    try {
      setProcessingStage('Fetching transcript...')
      
      const response = await fetch('/api/youtube/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          language: selectedLanguage || undefined,
          folderId: null
        }),
      })

      const result = await response.json()

      if (result.success) {
        setProcessingStage('Processing complete!')
        onGenerate(result.data.note.id)
        onClose()
      } else {
        throw new Error(result.error || 'Failed to process YouTube video')
      }
    } catch (error) {
      console.error('Error processing YouTube video:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while processing the video')
    } finally {
      setIsProcessing(false)
      setProcessingStage('')
    }
  }

  const isValidYoutubeUrl = (url: string) => {
    const transcriptService = new YouTubeTranscriptService()
    return transcriptService.isValidYouTubeUrl(url)
  }

  const getLanguageDisplayName = (langCode: string) => {
    const languageMap: Record<string, string> = {
      'en': '🇺🇸 English',
      'zh': '🇨🇳 中文',
      'es': '🇪🇸 Español',
      'fr': '🇫🇷 Français',
      'de': '🇩🇪 Deutsch',
      'ja': '🇯🇵 日本語',
      'ko': '🇰🇷 한국어',
      'pt': '🇵🇹 Português',
      'ru': '🇷🇺 Русский',
      'ar': '🇸🇦 العربية',
      'hi': '🇮🇳 हिन्दी',
    }
    return languageMap[langCode] || `🌐 ${langCode.toUpperCase()}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-tertiary rounded-2xl p-8 max-w-md w-full mx-4 relative border border-gray-600">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-8">YouTube Video Note</h2>
          
          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-left text-white font-medium mb-3">
              🔗 YouTube URL
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isProcessing}
              className="input-field w-full"
            />
            {youtubeUrl && !isValidYoutubeUrl(youtubeUrl) && (
              <p className="text-red-400 text-sm mt-2">Please enter a valid YouTube URL</p>
            )}
          </div>

          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-left text-white font-medium mb-2">
              🧠 Caption Language
            </label>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isProcessing || isLoadingLanguages}
              className="input-field w-full"
            >
              <option value="">🤖 Auto detect</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {getLanguageDisplayName(lang)}
                </option>
              ))}
            </select>
            
            {isLoadingLanguages && (
              <p className="text-mango-400 text-sm mt-2 flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-mango-400 border-t-transparent rounded-full"></div>
                Loading available languages...
              </p>
            )}
            
            {availableLanguages.length > 0 && !isLoadingLanguages && (
              <p className="text-gray-400 text-sm mt-2">
                Found {availableLanguages.length} available caption language{availableLanguages.length !== 1 ? 's' : ''}
              </p>
            )}
            
            {youtubeUrl && isValidYoutubeUrl(youtubeUrl) && availableLanguages.length === 0 && !isLoadingLanguages && (
              <p className="text-yellow-400 text-sm mt-2">
                No captions detected. The video might not have subtitles available.
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="mb-6 p-4 bg-mango-500/10 border border-mango-500/20 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="animate-spin w-5 h-5 border-2 border-mango-400 border-t-transparent rounded-full"></div>
                <p className="text-mango-400 font-medium">{processingStage}</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-mango-500 h-2 rounded-full animate-pulse w-2/3"></div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!youtubeUrl.trim() || !isValidYoutubeUrl(youtubeUrl) || isProcessing || isLoadingLanguages}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Note
              </>
            )}
          </button>

          <p className="text-gray-400 text-xs mt-4">
            This will extract captions from the YouTube video and create study materials using AI.
          </p>
        </div>
      </div>
    </div>
  )
}