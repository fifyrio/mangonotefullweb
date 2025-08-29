'use client'

import React, { useState } from 'react'
import LiveTranscriptionModal from '@/components/audio/LiveTranscriptionModal'
import MeetingRecorderModal from '@/components/audio/MeetingRecorderModal'
import VoiceCommandManager from '@/components/audio/VoiceCommandManager'
import { MeetingSegment } from '@/lib/realtime-audio-service'

export default function TestRealtimeAudioPage() {
  const [liveTranscriptionOpen, setLiveTranscriptionOpen] = useState(false)
  const [meetingRecorderOpen, setMeetingRecorderOpen] = useState(false)
  const [voiceCommandsActive, setVoiceCommandsActive] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev.slice(0, 9)])
  }

  const testAudioSupport = async () => {
    try {
      addTestResult('Testing browser audio support...')
      
      // Test MediaRecorder support
      if (!window.MediaRecorder) {
        addTestResult('❌ MediaRecorder not supported - This browser cannot record audio')
        return
      }
      addTestResult('✅ MediaRecorder supported')

      // Test getUserMedia support
      if (!navigator.mediaDevices?.getUserMedia) {
        addTestResult('❌ getUserMedia not supported - Cannot access microphone')
        return
      }
      addTestResult('✅ getUserMedia supported')

      // Test audio context
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        addTestResult('❌ AudioContext not supported - Cannot process audio')
        return
      }
      addTestResult('✅ AudioContext supported')

      // Test HTTPS requirement
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        addTestResult('⚠️ HTTPS required for microphone access in production')
      }

      // Test microphone access
      try {
        addTestResult('🎤 Requesting microphone access...')
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        })
        addTestResult('✅ Microphone access granted')
        
        // Test recording formats
        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/wav'
        ]
        
        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            addTestResult(`✅ ${mimeType} supported`)
          } else {
            addTestResult(`❌ ${mimeType} not supported`)
          }
        }
        
        // Test actual MediaRecorder creation
        try {
          const recorder = new MediaRecorder(stream)
          addTestResult('✅ MediaRecorder instance created successfully')
          recorder.stop()
        } catch (recorderError) {
          addTestResult(`❌ MediaRecorder creation failed: ${recorderError}`)
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        addTestResult('🧹 Microphone stream cleaned up')
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        if (errorMsg.includes('Permission denied')) {
          addTestResult('❌ Microphone permission denied - Please allow microphone access')
        } else if (errorMsg.includes('NotFound')) {
          addTestResult('❌ No microphone found - Please connect a microphone')
        } else {
          addTestResult(`❌ Microphone access failed: ${errorMsg}`)
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      addTestResult(`❌ Audio support test failed: ${errorMsg}`)
    }
  }

  const getAudioDevices = async () => {
    try {
      addTestResult('Fetching audio devices...')
      
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(track => track.stop())
      })
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      
      setAudioDevices(audioInputs)
      addTestResult(`✅ Found ${audioInputs.length} audio input devices`)
      
      audioInputs.forEach((device, index) => {
        addTestResult(`  Device ${index + 1}: ${device.label || 'Unknown Device'}`)
      })
      
    } catch (error) {
      addTestResult(`❌ Failed to get audio devices: ${error}`)
    }
  }

  const testRealtimeService = async () => {
    try {
      addTestResult('Testing RealtimeAudioService initialization...')
      
      const { RealtimeAudioService } = await import('@/lib/realtime-audio-service')
      
      if (!RealtimeAudioService.isSupported()) {
        addTestResult('❌ RealtimeAudioService not supported in this browser')
        return
      }
      addTestResult('✅ RealtimeAudioService browser support confirmed')
      
      // Test service initialization
      const service = new RealtimeAudioService(
        {
          language: 'en',
          chunkDuration: 3,
          enableVoiceCommands: true
        },
        {
          onTranscriptionChunk: (chunk) => {
            addTestResult(`📝 Transcription: "${chunk.text}" (${Math.round((chunk.confidence || 0) * 100)}%)`)
          },
          onVoiceCommand: (command) => {
            addTestResult(`🎤 Voice command: ${command.command} (${Math.round((command.confidence || 0) * 100)}%)`)
          },
          onError: (error) => {
            addTestResult(`❌ Service error: ${error.message}`)
          },
          onStatusChange: (status) => {
            addTestResult(`📊 Status changed: ${status}`)
          }
        }
      )
      
      await service.initialize()
      addTestResult('✅ RealtimeAudioService initialized successfully')
      
      // Clean up
      service.dispose()
      addTestResult('✅ RealtimeAudioService cleaned up')
      
    } catch (error) {
      addTestResult(`❌ RealtimeAudioService test failed: ${error}`)
    }
  }

  const testStreamingAPI = async () => {
    try {
      addTestResult('Testing streaming API...')
      
      const streamId = `test-${Date.now()}`
      
      // Test stream start
      const startResponse = await fetch('/api/realtime-audio/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          streamId: streamId
        })
      })
      
      if (startResponse.ok) {
        addTestResult('✅ Streaming API start endpoint working')
        
        // Test stream end
        const endResponse = await fetch('/api/realtime-audio/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end',
            streamId: streamId
          })
        })
        
        if (endResponse.ok) {
          addTestResult('✅ Streaming API end endpoint working')
        } else {
          addTestResult('❌ Streaming API end endpoint failed')
        }
        
      } else {
        addTestResult('❌ Streaming API start endpoint failed')
      }
      
    } catch (error) {
      addTestResult(`❌ Streaming API test failed: ${error}`)
    }
  }

  const handleMeetingComplete = (segments: MeetingSegment[]) => {
    addTestResult(`📋 Meeting completed with ${segments.length} segments`)
    segments.forEach((segment, index) => {
      addTestResult(`  Segment ${index + 1}: "${segment.text.substring(0, 50)}..." (${segment.speaker})`)
    })
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-dark-primary text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <i className="ri-mic-line text-2xl text-mango-500"></i>
          <h1 className="text-3xl font-bold">Real-time Audio Processing Test</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            {/* Browser Support Tests */}
            <div className="bg-dark-secondary rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <i className="ri-test-tube-line mr-2 text-mango-500"></i>
                Browser Support Tests
              </h2>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      addTestResult('🎤 Requesting microphone permission...')
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                      addTestResult('✅ Microphone permission granted!')
                      stream.getTracks().forEach(track => track.stop())
                    } catch (error) {
                      addTestResult(`❌ Permission denied: ${error}`)
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <i className="ri-mic-line"></i>
                  <span>Request Microphone Permission</span>
                </button>
                
                <button
                  onClick={testAudioSupport}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <i className="ri-sound-module-line"></i>
                  <span>Test Audio Support</span>
                </button>
                
                <button
                  onClick={getAudioDevices}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <i className="ri-mic-2-line"></i>
                  <span>Get Audio Devices</span>
                </button>
                
                <button
                  onClick={testRealtimeService}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <i className="ri-service-line"></i>
                  <span>Test Service Initialization</span>
                </button>
                
                <button
                  onClick={testStreamingAPI}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <i className="ri-broadcast-line"></i>
                  <span>Test Streaming API</span>
                </button>
              </div>
            </div>

            {/* Component Tests */}
            <div className="bg-dark-secondary rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <i className="ri-chat-voice-line mr-2 text-mango-500"></i>
                Component Tests
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setLiveTranscriptionOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <i className="ri-live-line"></i>
                  <span>Test Live Transcription</span>
                </button>
                
                <button
                  onClick={() => setMeetingRecorderOpen(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  <i className="ri-record-circle-line"></i>
                  <span>Test Meeting Recorder</span>
                </button>
                
                <button
                  onClick={() => setVoiceCommandsActive(!voiceCommandsActive)}
                  className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                    voiceCommandsActive 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <i className={`ri-command-line ${voiceCommandsActive ? 'animate-pulse' : ''}`}></i>
                  <span>{voiceCommandsActive ? 'Stop' : 'Start'} Voice Commands</span>
                </button>
              </div>
            </div>

            {/* Voice Command Manager */}
            {voiceCommandsActive && (
              <div className="bg-dark-secondary rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <i className="ri-voice-recognition-line mr-2 text-mango-500"></i>
                  Voice Commands
                </h2>
                <VoiceCommandManager
                  isActive={voiceCommandsActive}
                  onCommandDetected={(command) => {
                    addTestResult(`🎤 Voice command detected: ${command.command}`)
                  }}
                />
              </div>
            )}

            {/* Audio Devices */}
            {audioDevices.length > 0 && (
              <div className="bg-dark-secondary rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <i className="ri-mic-2-line mr-2 text-mango-500"></i>
                  Available Audio Devices
                </h2>
                <div className="space-y-2">
                  {audioDevices.map((device, index) => (
                    <div key={device.deviceId} className="p-3 bg-dark-tertiary rounded-lg">
                      <div className="font-medium text-white">
                        {device.label || `Audio Device ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        ID: {device.deviceId.substring(0, 20)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-dark-secondary rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <i className="ri-terminal-line mr-2 text-mango-500"></i>
                Test Results
              </h2>
              <button
                onClick={clearResults}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-dark-primary rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {testResults.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No test results yet. Run some tests to see output here.
                </div>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-gray-300">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-dark-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <i className="ri-guide-line mr-2 text-mango-500"></i>
            Test Instructions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-mango-500 mb-2">Browser Support Tests:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Test Audio Support: Checks MediaRecorder, getUserMedia, AudioContext</li>
                <li>• Get Audio Devices: Lists available microphones</li>
                <li>• Test Service Init: Verifies RealtimeAudioService can be created</li>
                <li>• Test Streaming API: Checks API endpoints are working</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-mango-500 mb-2">Component Tests:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Live Transcription: Real-time speech-to-text modal</li>
                <li>• Meeting Recorder: Multi-speaker meeting capture</li>
                <li>• Voice Commands: Voice control interface</li>
                <li>• Try saying "start recording", "stop recording", "save note"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LiveTranscriptionModal
        isOpen={liveTranscriptionOpen}
        onClose={() => setLiveTranscriptionOpen(false)}
        title="Live Transcription Test"
        language="en"
      />

      <MeetingRecorderModal
        isOpen={meetingRecorderOpen}
        onClose={() => setMeetingRecorderOpen(false)}
        meetingTitle="Test Meeting Recording"
        onMeetingComplete={handleMeetingComplete}
      />
    </div>
  )
}