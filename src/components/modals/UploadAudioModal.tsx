'use client'

import { useState, useRef } from 'react'

interface UploadAudioModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (audioFile: File) => void
}

export default function UploadAudioModal({ isOpen, onClose, onGenerate }: UploadAudioModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile) return

    try {
      const formData = new FormData()
      formData.append('audio', selectedFile)
      
      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload audio')
      }

      if (result.success) {
        // Pass the note ID to the parent component
        onGenerate(selectedFile) // Keep existing interface for now
        onClose()
        // Reset form state
        setSelectedFile(null)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Audio upload error:', error)
      // You might want to add error state handling here
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
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
          <h2 className="text-2xl font-bold text-black mb-8">Upload audio</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 mb-6 cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 font-medium mb-2">
                Drag audio file here, or click to select
              </p>
              <p className="text-gray-500 text-sm">
                Supported formats: mp3, wav, ogg, flac, aac, wma, aiff
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.wma,.aiff"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">{selectedFile.name}</p>
              <p className="text-green-600 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

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
            disabled={!selectedFile}
            className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              selectedFile
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