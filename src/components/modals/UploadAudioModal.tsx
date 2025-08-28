'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface UploadAudioModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (audioFile: File) => void
}

interface ProcessingProgress {
  stage: 'uploading' | 'transcribing' | 'analyzing' | 'generating_materials' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface AudioProcessingResult {
  note: {
    id: string;
    title: string;
    transcription: string;
    audioUrl?: string;
    contentBlocks: number;
    flashcards: number;
  };
  transcription: {
    text: string;
    language?: string;
    duration?: number;
    segments: number;
    confidence?: number;
  };
}

const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg', // MP3
  'audio/mp4',  // M4A
  'audio/wav',  // WAV
  'audio/webm', // WebM
  'audio/ogg'   // OGG
];

export default function UploadAudioModal({ isOpen, onClose, onGenerate }: UploadAudioModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [generateMaterials, setGenerateMaterials] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [result, setResult] = useState<AudioProcessingResult | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('modals.uploadAudio')
  const router = useRouter()

  const supportedLanguages = [
    { code: '', name: t('autoDetect') },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese (Mandarin)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
  ]

  const validateAudioFile = (file: File): string | null => {
    if (!SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
      return 'Unsupported file format. Please upload MP3, M4A, WAV, WebM, or OGG files.';
    }
    
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 25MB.`;
    }
    
    return null;
  }

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
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file)
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "")) // Remove file extension
        }
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const processAudioFile = async () => {
    if (!selectedFile || !title.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    const validationError = validateAudioFile(selectedFile);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsProcessing(true);
    setProgress({
      stage: 'uploading',
      progress: 10,
      message: 'Preparing to process audio...'
    });

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('userId', 'user-123'); // TODO: Get from authentication
      formData.append('title', title.trim());
      if (language) formData.append('language', language);
      formData.append('generateLearningMaterials', generateMaterials.toString());

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (!prev || prev.stage === 'complete' || prev.stage === 'error') {
            clearInterval(progressInterval);
            return prev;
          }
          
          let newProgress = Math.min(prev.progress + 5, 95);
          let newMessage = prev.message;
          let newStage = prev.stage;
          
          if (newProgress > 30 && prev.stage === 'uploading') {
            newStage = 'transcribing';
            newMessage = 'Transcribing audio with Whisper...';
          } else if (newProgress > 60 && prev.stage === 'transcribing') {
            newStage = 'analyzing';
            newMessage = 'Analyzing content with AI...';
          } else if (newProgress > 80 && prev.stage === 'analyzing' && generateMaterials) {
            newStage = 'generating_materials';
            newMessage = 'Generating study materials...';
          }
          
          return {
            ...prev,
            stage: newStage,
            progress: newProgress,
            message: newMessage
          };
        });
      }, 2000);

      const response = await fetch('/api/audio/process', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audio processing failed');
      }

      const data = await response.json();
      
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Audio processing completed successfully!'
      });
      
      setResult(data.data);
      
      // Auto-redirect after success
      setTimeout(() => {
        onGenerate(selectedFile); // Keep compatibility with existing interface
        onClose();
        router.push(`/notes/${data.data.note.id}`);
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Audio processing error:', error);
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Audio processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setLanguage('');
    setGenerateMaterials(true);
    setIsProcessing(false);
    setProgress(null);
    setResult(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-primary rounded-2xl max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-dark-surface flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">🎤 Upload Audio File</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Processing State */}
          {isProcessing || result ? (
            <div className="space-y-6">
              {progress && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="w-full bg-dark-surface rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        progress.stage === 'error' ? 'bg-red-500' : 'bg-mango-500'
                      }`}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  
                  {/* Progress Message */}
                  <div className="text-center">
                    <p className="text-white font-medium">{progress.message}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {progress.progress}% complete
                    </p>
                  </div>
                  
                  {/* Stage Indicators */}
                  <div className="flex justify-between text-sm">
                    {['uploading', 'transcribing', 'analyzing', 'generating_materials', 'complete'].map((stage, index) => (
                      <div 
                        key={stage}
                        className={`flex flex-col items-center ${
                          progress.stage === stage ? 'text-mango-500' : 
                          index < ['uploading', 'transcribing', 'analyzing', 'generating_materials', 'complete'].indexOf(progress.stage) 
                            ? 'text-green-500' : 'text-gray-500'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full mb-1 ${
                          progress.stage === stage ? 'bg-mango-500' : 
                          index < ['uploading', 'transcribing', 'analyzing', 'generating_materials', 'complete'].indexOf(progress.stage) 
                            ? 'bg-green-500' : 'bg-gray-600'
                        }`} />
                        <span className="capitalize text-xs text-center">
                          {stage.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Error State */}
                  {progress.error && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                      <p className="text-red-400 font-medium">Error:</p>
                      <p className="text-red-300 text-sm mt-1">{progress.error}</p>
                      <button 
                        onClick={resetForm}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Success Result */}
              {result && progress?.stage === 'complete' && (
                <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-2">✅ Processing Complete!</h4>
                  <div className="text-green-300 text-sm space-y-1">
                    <p>• Transcription: {result.transcription.text.substring(0, 100)}...</p>
                    <p>• Duration: {result.transcription.duration ? `${Math.round(result.transcription.duration)}s` : 'Unknown'}</p>
                    <p>• Content blocks: {result.note.contentBlocks}</p>
                    <p>• Flashcards: {result.note.flashcards}</p>
                    {result.transcription.language && (
                      <p>• Language: {result.transcription.language}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload Form */
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter a title for your audio note..."
                  required
                />
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-mango-500 bg-mango-500/10'
                    : 'border-gray-600 hover:border-mango-500 hover:bg-mango-500/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🎵</div>
                  <p className="text-white font-medium mb-2">
                    {t('dragText')}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Supports MP3, M4A, WAV, WebM, OGG (max 25MB)
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

              {/* Selected File Display */}
              {selectedFile && (
                <div className="bg-dark-secondary border border-dark-surface rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input-field w-full"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Materials Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generateMaterials"
                  checked={generateMaterials}
                  onChange={(e) => setGenerateMaterials(e.target.checked)}
                  className="w-4 h-4 text-mango-500 bg-dark-surface border-gray-600 rounded focus:ring-mango-500"
                />
                <label htmlFor="generateMaterials" className="ml-2 text-sm text-gray-300">
                  Generate flashcards and study materials automatically
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={processAudioFile}
                disabled={!selectedFile || !title.trim()}
                className={`w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  selectedFile && title.trim()
                    ? 'bg-mango-500 hover:bg-mango-600 text-black'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('generateNote')}
              </button>

              {/* Processing Info */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Audio will be transcribed using OpenAI Whisper</p>
                <p>• AI will analyze content and generate study materials</p>
                <p>• Processing typically takes 1-3 minutes depending on file size</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}