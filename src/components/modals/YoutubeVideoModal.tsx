'use client'

import { useState } from 'react'

interface YoutubeVideoModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (youtubeUrl: string) => void
}

export default function YoutubeVideoModal({ isOpen, onClose, onGenerate }: YoutubeVideoModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const handleGenerate = () => {
    if (youtubeUrl.trim()) {
      onGenerate(youtubeUrl.trim())
      onClose()
    }
  }

  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-8">Youtube video note</h2>
          
          <div className="mb-6">
            <label className="block text-left text-black font-medium mb-3">
              🔗 Youtube link
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Ex. https://www.youtube.com/watch/example"
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-left text-black font-medium mb-2">
              🧠 Note language
            </label>
            <select className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black">
              <option>🤖 Auto detect</option>
              <option>🇺🇸 English</option>
              <option>🇨🇳 中文</option>
              <option>🇪🇸 Español</option>
              <option>🇫🇷 Français</option>
            </select>
            <p className="text-gray-500 text-sm mt-2">
              You can use AI auto-detect to detect the audio language and note generation language.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!youtubeUrl.trim() || !isValidYoutubeUrl(youtubeUrl)}
            className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              youtubeUrl.trim() && isValidYoutubeUrl(youtubeUrl)
                ? 'bg-gray-700 hover:bg-gray-800 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate note
          </button>
        </div>
      </div>
    </div>
  )
}