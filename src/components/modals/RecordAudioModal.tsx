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
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<string>('auto')

  const startRecording = async () => {
    setError('')
    setIsLoading(true)
    
    try {
      // 首先检查是否有音频设备
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      
      if (audioInputs.length === 0) {
        throw new Error('No microphone found. Please connect a microphone and try again.')
      }
      
      console.log('找到音频设备:', audioInputs.length, '个')
      
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // 检查浏览器支持的格式
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'
      }
      
      const recorder = new MediaRecorder(stream, { mimeType })
      setMediaRecorder(recorder)
      
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        setAudioBlob(blob)
        console.log('录音完成，音频大小:', blob.size, 'bytes')
      }
      
      recorder.start()
      setIsRecording(true)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setIsLoading(false)
      
      let errorMessage = 'Recording failed to start'
      
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone detected. Please check:\n• Microphone is connected\n• Other apps aren\'t using the microphone\n• Browser has microphone permission'
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access in browser settings.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application. Please close other apps using the microphone.'
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Microphone configuration error. Please try reconnecting your microphone.'
        } else {
          errorMessage = error.message || 'Unknown error'
        }
      }
      
      setError(errorMessage)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
    }
  }
  
  const resetRecording = () => {
    setAudioBlob(null)
    setError('')
    if (mediaRecorder && mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
    setMediaRecorder(null)
    setIsRecording(false)
  }

  const handleGenerate = () => {
    if (audioBlob) {
      // 可以在这里传递语言设置
      onGenerate(audioBlob)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-secondary rounded-2xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <i className="ri-error-warning-line text-red-400 flex-shrink-0 mt-0.5"></i>
              <div className="text-red-400 text-sm whitespace-pre-line">
                {error}
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Record Audio</h2>
          
          <div className="mb-8">
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-dark-tertiary'
            }`}>
              {isRecording ? (
                <div className="w-8 h-8 bg-white rounded-full animate-pulse"></div>
              ) : audioBlob ? (
                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            
            <p className="text-gray-300 mb-4">
              {isRecording ? 'Recording in progress...' : audioBlob ? 'Recording completed' : 'Click the button below to start recording'}
            </p>
            
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                disabled={isLoading}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isLoading 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Detecting device...</span>
                  </div>
                ) : (
                  'Start Recording'
                )}
              </button>
            )}
            
            {isRecording && (
              <button
                onClick={stopRecording}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Stop Recording
              </button>
            )}
          </div>

          {audioBlob && (
            <div className="mb-6">
              <div className="bg-dark-tertiary rounded-lg p-4 mb-4">
                <audio controls className="w-full">
                  <source src={URL.createObjectURL(audioBlob)} />
                </audio>
              </div>
              <button
                onClick={resetRecording}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Re-record
              </button>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-left text-white font-medium mb-2">
              🧠 Note Language
            </label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border border-gray-600 rounded-lg bg-dark-tertiary text-white focus:border-mango-500 focus:outline-none"
            >
              <option value="auto">🤖 Auto detect</option>
              <option value="en">🇺🇸 English</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
            <p className="text-gray-400 text-sm mt-2">
              You can use AI auto-detect to detect the audio language and note generation language.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!audioBlob}
            className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              audioBlob
                ? 'bg-mango-500 hover:bg-mango-600 text-black'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Notes
          </button>
          
          {/* 设备状态提示 */}
          <div className="mt-4 text-xs text-gray-400 text-center space-y-1">
            <p>💡 Ensure microphone is connected and browser has permission</p>
            <p>🔒 Requires HTTPS or localhost environment</p>
          </div>
        </div>
      </div>
    </div>
  )
}