'use client'

import { useState } from 'react'

interface RecordAudioModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (audioBlob: Blob) => void
}

export default function RecordAudioModal({ isOpen, onClose, onGenerate }: RecordAudioModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
      }
      
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handleGenerate = () => {
    if (audioBlob) {
      onGenerate(audioBlob)
      onClose()
    }
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
          <h2 className="text-2xl font-bold text-black mb-8">Record audio</h2>
          
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              {isRecording ? (
                <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
              ) : (
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Stop Recording
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Start Recording
              </button>
            )}
          </div>

          {audioBlob && (
            <div className="mb-6">
              <p className="text-green-600 mb-2">Recording completed!</p>
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
              </audio>
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
            disabled={!audioBlob}
            className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              audioBlob
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