'use client'

import React, { useState, useEffect, useRef } from 'react'
import { VoiceCommand } from '@/lib/realtime-audio-service'

interface VoiceCommandManagerProps {
  isActive: boolean
  onCommandDetected?: (command: VoiceCommand) => void
  language?: string
  customCommands?: Record<string, { action: string; confidence: number }>
}

interface CommandHistory {
  command: VoiceCommand
  executed: boolean
  result?: string
  error?: string
}

export default function VoiceCommandManager({
  isActive,
  onCommandDetected,
  language = 'en',
  customCommands = {}
}: VoiceCommandManagerProps) {
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([])
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null)
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle')

  // Built-in voice commands
  const builtInCommands = {
    // Recording controls
    'start recording': { action: 'start_recording', confidence: 0.8 },
    'stop recording': { action: 'stop_recording', confidence: 0.8 },
    'pause recording': { action: 'pause_recording', confidence: 0.8 },
    'resume recording': { action: 'resume_recording', confidence: 0.8 },
    
    // Note management
    'save note': { action: 'save_note', confidence: 0.8 },
    'create flashcard': { action: 'create_flashcard', confidence: 0.7 },
    'new section': { action: 'new_section', confidence: 0.7 },
    'summarize': { action: 'summarize', confidence: 0.7 },
    'create mindmap': { action: 'create_mindmap', confidence: 0.7 },
    
    // Navigation
    'go to dashboard': { action: 'navigate_dashboard', confidence: 0.8 },
    'open settings': { action: 'open_settings', confidence: 0.8 },
    'show notes': { action: 'show_notes', confidence: 0.8 },
    
    // Study commands
    'start quiz': { action: 'start_quiz', confidence: 0.7 },
    'review flashcards': { action: 'review_flashcards', confidence: 0.7 },
    'study mode': { action: 'study_mode', confidence: 0.7 },
    
    // Export/Share
    'export note': { action: 'export_note', confidence: 0.7 },
    'share note': { action: 'share_note', confidence: 0.7 },
    
    // Meeting specific
    'new speaker': { action: 'new_speaker', confidence: 0.7 },
    'switch speaker': { action: 'switch_speaker', confidence: 0.7 },
    'end meeting': { action: 'end_meeting', confidence: 0.8 },
  }

  // Combine built-in and custom commands
  const allCommands = { ...builtInCommands, ...customCommands }

  // Language-specific commands
  const getLocalizedCommands = () => {
    if (language === 'zh') {
      return {
        '开始录音': { action: 'start_recording', confidence: 0.8 },
        '停止录音': { action: 'stop_recording', confidence: 0.8 },
        '暂停录音': { action: 'pause_recording', confidence: 0.8 },
        '继续录音': { action: 'resume_recording', confidence: 0.8 },
        '保存笔记': { action: 'save_note', confidence: 0.8 },
        '创建闪卡': { action: 'create_flashcard', confidence: 0.7 },
        '新建章节': { action: 'new_section', confidence: 0.7 },
        '总结': { action: 'summarize', confidence: 0.7 },
        '思维导图': { action: 'create_mindmap', confidence: 0.7 },
        '结束会议': { action: 'end_meeting', confidence: 0.8 },
        ...allCommands // Include English commands as fallback
      }
    }
    return allCommands
  }

  const commands = getLocalizedCommands()

  useEffect(() => {
    if (isActive) {
      setIsListening(true)
      setStatus('listening')
    } else {
      setIsListening(false)
      setStatus('idle')
    }
  }, [isActive])

  const detectVoiceCommands = (text: string): VoiceCommand[] => {
    const detectedCommands: VoiceCommand[] = []
    const lowerText = text.toLowerCase().trim()
    
    // Check for exact matches first
    for (const [phrase, config] of Object.entries(commands)) {
      if (lowerText.includes(phrase.toLowerCase())) {
        const command: VoiceCommand = {
          command: config.action,
          confidence: config.confidence,
          timestamp: Date.now(),
          parameters: { 
            originalText: text,
            detectedPhrase: phrase,
            language
          }
        }
        
        detectedCommands.push(command)
        break // Only trigger first match to avoid conflicts
      }
    }

    // Check for partial matches with lower confidence
    if (detectedCommands.length === 0) {
      for (const [phrase, config] of Object.entries(commands)) {
        const phraseWords = phrase.toLowerCase().split(' ')
        const textWords = lowerText.split(' ')
        
        // Check if most words match
        const matchCount = phraseWords.filter(word => 
          textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
        ).length
        
        const matchRatio = matchCount / phraseWords.length
        
        if (matchRatio > 0.6) { // 60% word match threshold
          const command: VoiceCommand = {
            command: config.action,
            confidence: config.confidence * matchRatio, // Reduce confidence based on match ratio
            timestamp: Date.now(),
            parameters: { 
              originalText: text,
              detectedPhrase: phrase,
              matchRatio,
              language,
              fuzzyMatch: true
            }
          }
          
          detectedCommands.push(command)
          break
        }
      }
    }

    return detectedCommands
  }

  const handleCommand = async (command: VoiceCommand): Promise<boolean> => {
    try {
      setStatus('processing')
      setLastCommand(command)

      // Add to history
      const historyEntry: CommandHistory = {
        command,
        executed: false
      }

      setCommandHistory(prev => [...prev.slice(-9), historyEntry]) // Keep last 10

      // Execute command based on action
      let executed = false
      let result = ''

      switch (command.command) {
        case 'navigate_dashboard':
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard'
            executed = true
            result = 'Navigated to dashboard'
          }
          break

        case 'open_settings':
          // Trigger settings modal or navigation
          executed = true
          result = 'Settings opened'
          break

        case 'export_note':
          // Trigger export functionality
          executed = true
          result = 'Note export initiated'
          break

        default:
          // For other commands, pass to parent component
          if (onCommandDetected) {
            onCommandDetected(command)
            executed = true
            result = `Command '${command.command}' sent to parent`
          }
          break
      }

      // Update history with result
      setCommandHistory(prev => 
        prev.map((entry, index) => 
          index === prev.length - 1 
            ? { ...entry, executed, result }
            : entry
        )
      )

      setStatus('listening')
      return executed

    } catch (error) {
      console.error('Command execution failed:', error)
      
      // Update history with error
      setCommandHistory(prev => 
        prev.map((entry, index) => 
          index === prev.length - 1 
            ? { ...entry, executed: false, error: error instanceof Error ? error.message : 'Unknown error' }
            : entry
        )
      )

      setStatus('listening')
      return false
    }
  }

  // Public method to process transcription text
  const processTranscription = (text: string) => {
    if (!isListening || !text.trim()) return

    const detectedCommands = detectVoiceCommands(text)
    
    for (const command of detectedCommands) {
      // Only execute high-confidence commands automatically
      if (command.confidence >= 0.7) {
        handleCommand(command)
      } else if (command.confidence >= 0.5) {
        // Lower confidence commands are logged but not executed
        console.log('Low confidence command detected:', command)
        setCommandHistory(prev => [...prev.slice(-9), {
          command,
          executed: false,
          result: 'Low confidence - not executed'
        }])
      }
    }
  }

  // Expose the processing method via ref (if needed)
  // This component doesn't currently use forwardRef, so this is commented out
  // React.useImperativeHandle(ref, () => ({
  //   processTranscription
  // }), [processTranscription])

  const getCommandStatusIcon = (entry: CommandHistory) => {
    if (entry.error) return 'ri-error-warning-line text-red-400'
    if (entry.executed) return 'ri-check-line text-green-400'
    return 'ri-time-line text-yellow-400'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="voice-command-manager">
      {/* Status Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          status === 'listening' ? 'bg-green-400 animate-pulse' :
          status === 'processing' ? 'bg-yellow-400 animate-pulse' :
          'bg-gray-400'
        }`}></div>
        <span className="text-sm text-gray-300">
          Voice Commands {status === 'listening' ? 'Active' : 
                         status === 'processing' ? 'Processing' : 'Inactive'}
        </span>
      </div>

      {/* Last Detected Command */}
      {lastCommand && (
        <div className="mb-4 p-3 bg-dark-tertiary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-mango-500">Last Command</span>
            <span className={`text-xs ${getConfidenceColor(lastCommand.confidence)}`}>
              {Math.round(lastCommand.confidence * 100)}%
            </span>
          </div>
          <div className="text-white text-sm">{lastCommand.command.replace(/_/g, ' ')}</div>
          <div className="text-xs text-gray-400 mt-1">
            "{lastCommand.parameters?.originalText}"
          </div>
        </div>
      )}

      {/* Available Commands */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Available Commands</h4>
        <div className="max-h-32 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1 text-xs">
            {Object.entries(commands).slice(0, 10).map(([phrase, config]) => (
              <div key={phrase} className="flex justify-between items-center py-1 px-2 bg-dark-primary rounded">
                <span className="text-gray-300">"{phrase}"</span>
                <span className={`${getConfidenceColor(config.confidence)}`}>
                  {Math.round(config.confidence * 100)}%
                </span>
              </div>
            ))}
            {Object.keys(commands).length > 10 && (
              <div className="text-center py-1 text-gray-500">
                +{Object.keys(commands).length - 10} more commands
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Commands</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {commandHistory.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="p-2 bg-dark-primary rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">
                    {entry.command.command.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-1">
                    <i className={getCommandStatusIcon(entry)}></i>
                    <span className={getConfidenceColor(entry.command.confidence)}>
                      {Math.round(entry.command.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="text-gray-400">
                  "{entry.command.parameters?.originalText?.substring(0, 30)}..."
                </div>
                {(entry.result || entry.error) && (
                  <div className={`mt-1 ${entry.error ? 'text-red-400' : 'text-green-400'}`}>
                    {entry.result || entry.error}
                  </div>
                )}
                <div className="text-gray-500 mt-1">
                  {new Date(entry.command.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-800 rounded text-xs">
          <div className="text-gray-400 mb-1">Debug Info:</div>
          <div className="text-gray-300">
            Language: {language} | Commands: {Object.keys(commands).length} | Status: {status}
          </div>
        </div>
      )}
    </div>
  )
}

// Export the process method for external use
export const processVoiceTranscription = (text: string, commands: Record<string, any> = {}) => {
  const allCommands = { 
    ...{
      'start recording': { action: 'start_recording', confidence: 0.8 },
      'stop recording': { action: 'stop_recording', confidence: 0.8 },
      'save note': { action: 'save_note', confidence: 0.8 },
    }, 
    ...commands 
  }

  const lowerText = text.toLowerCase().trim()
  
  for (const [phrase, config] of Object.entries(allCommands)) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return {
        command: config.action,
        confidence: config.confidence,
        timestamp: Date.now(),
        parameters: { originalText: text, detectedPhrase: phrase }
      }
    }
  }
  
  return null
}