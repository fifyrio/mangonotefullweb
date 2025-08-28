'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RealtimeAudioService, TranscriptionChunk, VoiceCommand } from '@/lib/realtime-audio-service'

interface LiveTranscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  noteId?: string
  title?: string
  language?: string
}

interface TranscriptionLine {
  id: string
  text: string
  timestamp: Date
  confidence: number
  isFinal: boolean
}

export default function LiveTranscriptionModal({
  isOpen,
  onClose,
  noteId,
  title = "Live Transcription",
  language = "en"
}: LiveTranscriptionModalProps) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle')
  const [transcriptionLines, setTranscriptionLines] = useState<TranscriptionLine[]>([])
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([])
  const [error, setError] = useState<string>('')
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)

  const realtimeServiceRef = useRef<RealtimeAudioService | null>(null)
  const transcriptionEndRef = useRef<HTMLDivElement>(null)
  const volumeAnalyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (isOpen && !realtimeServiceRef.current) {
      console.log('Modal opened, initializing service...')
      initializeService()
    }

    return () => {
      if (!isOpen) {
        cleanup()
      }
    }
  }, [isOpen])

  // Auto-scroll to bottom when new transcription arrives
  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcriptionLines])

  const initializeService = async () => {
    try {
      console.log('Initializing real-time audio service...')
      setError('')
      setStatus('idle')
      
      // Check browser support first
      if (!RealtimeAudioService.isSupported()) {
        const errorMsg = 'Real-time audio is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.'
        console.error(errorMsg)
        setError(errorMsg)
        setStatus('error')
        return
      }
      console.log('Browser support confirmed')

      // Test microphone access first
      try {
        console.log('Testing microphone access...')
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('Microphone access test successful')
        testStream.getTracks().forEach(track => track.stop()) // Clean up test stream
      } catch (micError) {
        console.error('Microphone access failed:', micError)
        setError('Microphone access denied. Please allow microphone access and refresh the page.')
        setStatus('error')
        return
      }

      const service = new RealtimeAudioService(
        {
          language,
          chunkDuration: 3,
          enableVoiceCommands: true,
          enableMeetingMode: false
        },
        {
          onTranscriptionChunk: handleTranscriptionChunk,
          onVoiceCommand: handleVoiceCommand,
          onError: handleError,
          onStatusChange: setStatus
        }
      )
      console.log('Service created')

      await service.initialize()
      console.log('Service initialized successfully')
      realtimeServiceRef.current = service
      
      // Setup volume monitoring
      setupVolumeMonitoring()
      
    } catch (err) {
      console.error('Failed to initialize real-time service:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to initialize audio service: ${errorMessage}`)
      setStatus('error')
    }
  }

  const setupVolumeMonitoring = () => {
    if (!realtimeServiceRef.current) return

    try {
      // Access the audio context for volume monitoring
      const audioContext = (realtimeServiceRef.current as any).audioContext
      const stream = (realtimeServiceRef.current as any).stream
      
      if (audioContext && stream) {
        const source = audioContext.createMediaStreamSource(stream)
        const analyzer = audioContext.createAnalyser()
        analyzer.fftSize = 256
        source.connect(analyzer)
        
        volumeAnalyzerRef.current = analyzer
        startVolumeMonitoring()
      }
    } catch (err) {
      console.warn('Volume monitoring setup failed:', err)
    }
  }

  const startVolumeMonitoring = () => {
    if (!volumeAnalyzerRef.current) return

    const analyzer = volumeAnalyzerRef.current
    const dataArray = new Uint8Array(analyzer.frequencyBinCount)

    const updateVolume = () => {
      analyzer.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setVolume(Math.min(100, (average / 255) * 100))

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateVolume)
      }
    }

    updateVolume()
  }

  const handleTranscriptionChunk = (chunk: TranscriptionChunk) => {
    const newLine: TranscriptionLine = {
      id: chunk.id,
      text: chunk.text,
      timestamp: new Date(chunk.timestamp),
      confidence: chunk.confidence || 0.5,
      isFinal: chunk.isFinal
    }

    setTranscriptionLines(prev => {
      // Replace existing line with same ID or add new line
      const existingIndex = prev.findIndex(line => line.id === chunk.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newLine
        return updated
      }
      return [...prev, newLine]
    })
  }

  const handleVoiceCommand = (command: VoiceCommand) => {
    setVoiceCommands(prev => [...prev.slice(-4), command]) // Keep last 5 commands
    
    // Handle built-in commands
    switch (command.command) {
      case 'stop_recording':
        stopRecording()
        break
      case 'pause_recording':
        pauseRecording()
        break
      case 'resume_recording':
        resumeRecording()
        break
      case 'save_note':
        saveTranscription()
        break
    }
  }

  const handleError = (error: Error) => {
    setError(error.message)
    setStatus('error')
  }

  const startRecording = async () => {
    console.log('Start recording clicked')
    
    if (!realtimeServiceRef.current) {
      console.error('Service not initialized')
      setError('Service not initialized. Please refresh and try again.')
      return
    }

    try {
      console.log('Clearing error and starting recording...')
      setError('')
      await realtimeServiceRef.current.startRecording()
      console.log('Recording started successfully')
      setIsRecording(true)
      startVolumeMonitoring()
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError(`Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const stopRecording = async () => {
    if (!realtimeServiceRef.current) return

    try {
      await realtimeServiceRef.current.stopRecording()
      setIsRecording(false)
      setVolume(0)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
    }
  }

  const pauseRecording = () => {
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.pauseRecording()
    }
  }

  const resumeRecording = () => {
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.resumeRecording()
    }
  }

  const saveTranscription = async () => {
    if (!noteId || transcriptionLines.length === 0) return

    const fullTranscription = transcriptionLines
      .filter(line => line.isFinal)
      .map(line => line.text)
      .join(' ')

    // TODO: Implement API call to save transcription to note
    console.log('Would save transcription to note:', noteId, fullTranscription)
  }

  const clearTranscription = () => {
    setTranscriptionLines([])
    setVoiceCommands([])
  }

  const cleanup = () => {
    console.log('Cleaning up real-time audio service')
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (realtimeServiceRef.current) {
      try {
        realtimeServiceRef.current.dispose()
      } catch (err) {
        console.warn('Error during cleanup:', err)
      }
      realtimeServiceRef.current = null
    }
    
    // Reset states
    setIsRecording(false)
    setVolume(0)
    setStatus('idle')
  }

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'text-green-400'
      case 'processing': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'listening': return 'Listening...'
      case 'processing': return 'Processing...'
      case 'error': return 'Error'
      default: return 'Ready'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-400 transition-all duration-100"
                      style={{ width: `${volume}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400">{Math.round(volume)}%</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <i className="ri-error-warning-line text-red-400"></i>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 p-6 border-b border-gray-700">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <i className="ri-mic-line text-xl"></i>
              <span>Start Recording</span>
            </button>
          ) : (
            <>
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <i className="ri-stop-fill text-xl"></i>
                <span>Stop</span>
              </button>
              
              {status === 'listening' ? (
                <button
                  onClick={pauseRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <i className="ri-pause-fill text-xl"></i>
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <i className="ri-play-fill text-xl"></i>
                  <span>Resume</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={clearTranscription}
            className="flex items-center space-x-2 px-4 py-3 bg-dark-tertiary hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <i className="ri-delete-bin-line"></i>
            <span>Clear</span>
          </button>

          {noteId && (
            <button
              onClick={saveTranscription}
              disabled={transcriptionLines.length === 0}
              className="flex items-center space-x-2 px-4 py-3 bg-mango-500 hover:bg-mango-600 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-save-line"></i>
              <span>Save</span>
            </button>
          )}
        </div>

        {/* Transcription Display */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Transcription */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-3">
              {transcriptionLines.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <i className="ri-mic-off-line text-4xl mb-4"></i>
                  <p>No transcription yet. Start recording to begin.</p>
                </div>
              ) : (
                transcriptionLines.map((line) => (
                  <div
                    key={line.id}
                    className={`p-3 rounded-lg ${line.isFinal ? 'bg-dark-tertiary' : 'bg-gray-800/50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-white ${!line.isFinal ? 'opacity-60 italic' : ''}`}>
                          {line.text}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {line.timestamp.toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                line.confidence > 0.8 ? 'bg-green-400' :
                                line.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                            ></div>
                            <span className="text-xs text-gray-400">
                              {Math.round(line.confidence * 100)}%
                            </span>
                          </div>
                          {!line.isFinal && (
                            <span className="text-xs text-gray-500 italic">Processing...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptionEndRef}></div>
            </div>
          </div>

          {/* Voice Commands Sidebar */}
          {voiceCommands.length > 0 && (
            <div className="w-64 border-l border-gray-700 p-4 overflow-y-auto">
              <h3 className="font-semibold text-white mb-3">Voice Commands</h3>
              <div className="space-y-2">
                {voiceCommands.map((command, index) => (
                  <div key={index} className="p-2 bg-dark-tertiary rounded text-sm">
                    <div className="font-medium text-mango-500">{command.command}</div>
                    <div className="text-gray-400 text-xs">
                      {new Date(command.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Lines: {transcriptionLines.filter(l => l.isFinal).length}</span>
            <span>Commands: {voiceCommands.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Language: {language.toUpperCase()}</span>
            {noteId && (
              <span className="text-mango-500">• Linked to Note</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}