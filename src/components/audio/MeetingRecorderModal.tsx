'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MeetingRecorder, MeetingSegment } from '@/lib/realtime-audio-service'

interface MeetingRecorderModalProps {
  isOpen: boolean
  onClose: () => void
  meetingTitle?: string
  onMeetingComplete?: (segments: MeetingSegment[]) => void
}

interface Speaker {
  id: string
  name: string
  color: string
}

const SPEAKER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export default function MeetingRecorderModal({
  isOpen,
  onClose,
  meetingTitle = "Meeting Recording",
  onMeetingComplete
}: MeetingRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [segments, setSegments] = useState<MeetingSegment[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: 'Speaker', name: 'Speaker', color: SPEAKER_COLORS[0] }
  ])
  const [currentSpeaker, setCurrentSpeaker] = useState('Speaker')
  const [newSpeakerName, setNewSpeakerName] = useState('')
  const [duration, setDuration] = useState(0)
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle')

  const meetingRecorderRef = useRef<MeetingRecorder | null>(null)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const segmentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && !meetingRecorderRef.current) {
      initializeMeetingRecorder()
    }

    return () => {
      cleanup()
    }
  }, [isOpen])

  // Update duration timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording])

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (segmentsEndRef.current) {
      segmentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [segments])

  const initializeMeetingRecorder = async () => {
    try {
      const recorder = new MeetingRecorder({
        language: 'en',
        chunkDuration: 5,
        enableVoiceCommands: true,
        enableMeetingMode: true
      })

      meetingRecorderRef.current = recorder
      setStatus('idle')
      
    } catch (error) {
      console.error('Failed to initialize meeting recorder:', error)
      setStatus('error')
    }
  }

  const startMeeting = async () => {
    if (!meetingRecorderRef.current) return

    try {
      setStatus('listening')
      await meetingRecorderRef.current.startMeeting()
      setIsRecording(true)
      startTimeRef.current = Date.now()
      setSegments([])
      
      // Start polling for new segments
      pollForSegments()
      
    } catch (error) {
      console.error('Failed to start meeting:', error)
      setStatus('error')
    }
  }

  const endMeeting = async () => {
    if (!meetingRecorderRef.current) return

    try {
      setStatus('processing')
      const finalSegments = await meetingRecorderRef.current.endMeeting()
      setSegments(finalSegments)
      setIsRecording(false)
      setStatus('idle')
      
      if (onMeetingComplete) {
        onMeetingComplete(finalSegments)
      }
      
    } catch (error) {
      console.error('Failed to end meeting:', error)
      setStatus('error')
    }
  }

  const pollForSegments = () => {
    // In a real implementation, this would poll the meeting recorder for new segments
    // For now, we'll simulate it by checking the recorder's segments periodically
    const pollInterval = setInterval(() => {
      if (!isRecording || !meetingRecorderRef.current) {
        clearInterval(pollInterval)
        return
      }

      // Get current segments from recorder
      const currentSegments = (meetingRecorderRef.current as any).segments || []
      if (currentSegments.length !== segments.length) {
        setSegments([...currentSegments])
      }
    }, 2000)
  }

  const addSpeaker = () => {
    if (!newSpeakerName.trim()) return

    const speakerId = `speaker-${speakers.length}`
    const newSpeaker: Speaker = {
      id: speakerId,
      name: newSpeakerName.trim(),
      color: SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length]
    }

    setSpeakers(prev => [...prev, newSpeaker])
    setNewSpeakerName('')
  }

  const changeSpeaker = (speakerId: string) => {
    setCurrentSpeaker(speakerId)
    // TODO: Notify the meeting recorder about speaker change
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const exportMeeting = () => {
    if (segments.length === 0) return

    const transcript = segments.map(segment => 
      `[${new Date(segment.startTime).toLocaleTimeString()} - ${new Date(segment.endTime).toLocaleTimeString()}] ${segment.speaker}: ${segment.text}`
    ).join('\n\n')

    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meetingTitle.replace(/[^a-zA-Z0-9]/g, '_')}_transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSpeakerColor = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId)
    return speaker?.color || SPEAKER_COLORS[0]
  }

  const getSpeakerName = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId)
    return speaker?.name || speakerId
  }

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (meetingRecorderRef.current) {
      meetingRecorderRef.current.dispose()
      meetingRecorderRef.current = null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary rounded-lg shadow-xl w-full max-w-6xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{meetingTitle}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <div className={`flex items-center space-x-2 ${
                status === 'listening' ? 'text-green-400' :
                status === 'processing' ? 'text-yellow-400' :
                status === 'error' ? 'text-red-400' : 'text-gray-400'
              }`}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                <span className="text-sm capitalize">{status}</span>
              </div>
              {isRecording && (
                <div className="flex items-center space-x-2 text-white">
                  <i className="ri-time-line text-red-400"></i>
                  <span className="font-mono text-sm">{formatDuration(duration)}</span>
                </div>
              )}
              <div className="text-sm text-gray-400">
                Segments: {segments.length}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startMeeting}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <i className="ri-record-circle-line text-xl"></i>
                    <span>Start Meeting</span>
                  </button>
                ) : (
                  <button
                    onClick={endMeeting}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <i className="ri-stop-circle-line text-xl"></i>
                    <span>End Meeting</span>
                  </button>
                )}

                <select
                  value={currentSpeaker}
                  onChange={(e) => changeSpeaker(e.target.value)}
                  className="px-4 py-2 bg-dark-tertiary text-white rounded-lg border border-gray-600 focus:border-mango-500 focus:outline-none"
                  disabled={!isRecording}
                >
                  {speakers.map(speaker => (
                    <option key={speaker.id} value={speaker.id}>
                      {speaker.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                {segments.length > 0 && (
                  <button
                    onClick={exportMeeting}
                    className="flex items-center space-x-2 px-4 py-2 bg-mango-500 hover:bg-mango-600 text-black rounded-lg transition-colors"
                  >
                    <i className="ri-download-line"></i>
                    <span>Export</span>
                  </button>
                )}
              </div>
            </div>

            {/* Meeting Transcript */}
            <div className="flex-1 p-6 overflow-y-auto">
              {segments.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <i className="ri-chat-voice-line text-4xl mb-4"></i>
                  <p className="text-lg mb-2">No recording yet</p>
                  <p className="text-sm">Start the meeting to begin capturing conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="flex space-x-4 p-4 bg-dark-tertiary rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: getSpeakerColor(segment.speaker) }}
                        >
                          {getSpeakerName(segment.speaker).charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span 
                            className="font-semibold"
                            style={{ color: getSpeakerColor(segment.speaker) }}
                          >
                            {getSpeakerName(segment.speaker)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(segment.startTime).toLocaleTimeString()} - {new Date(segment.endTime).toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              segment.confidence > 0.8 ? 'bg-green-400' :
                              segment.confidence > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                            <span className="text-xs text-gray-400">
                              {Math.round(segment.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-white leading-relaxed">{segment.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={segmentsEndRef}></div>
                </div>
              )}
            </div>
          </div>

          {/* Speakers Sidebar */}
          <div className="w-80 border-l border-gray-700 p-6 overflow-y-auto">
            <h3 className="font-semibold text-white mb-4">Speakers</h3>
            
            {/* Add New Speaker */}
            <div className="mb-6 p-4 bg-dark-tertiary rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Add Speaker</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSpeakerName}
                  onChange={(e) => setNewSpeakerName(e.target.value)}
                  placeholder="Speaker name"
                  className="flex-1 px-3 py-2 bg-dark-primary text-white rounded border border-gray-600 focus:border-mango-500 focus:outline-none text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addSpeaker()}
                />
                <button
                  onClick={addSpeaker}
                  className="px-3 py-2 bg-mango-500 hover:bg-mango-600 text-black rounded transition-colors"
                >
                  <i className="ri-add-line text-sm"></i>
                </button>
              </div>
            </div>

            {/* Speakers List */}
            <div className="space-y-2">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSpeaker === speaker.id 
                      ? 'bg-mango-500/20 border border-mango-500/30' 
                      : 'bg-dark-primary hover:bg-gray-700'
                  }`}
                  onClick={() => changeSpeaker(speaker.id)}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: speaker.color }}
                  >
                    {speaker.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{speaker.name}</div>
                    <div className="text-xs text-gray-400">
                      {segments.filter(s => s.speaker === speaker.id).length} segments
                    </div>
                  </div>
                  {currentSpeaker === speaker.id && (
                    <i className="ri-check-line text-mango-500"></i>
                  )}
                </div>
              ))}
            </div>

            {/* Meeting Stats */}
            <div className="mt-8 p-4 bg-dark-primary rounded-lg">
              <h4 className="font-semibold text-white mb-3">Meeting Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-mono">{formatDuration(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Segments:</span>
                  <span className="text-white">{segments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Words:</span>
                  <span className="text-white">
                    {segments.reduce((acc, seg) => acc + seg.text.split(' ').length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speakers:</span>
                  <span className="text-white">{speakers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}