'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface AudioUploadProps {
  userId: string;
  folderId?: string;
  onUploadComplete?: (noteId: string) => void;
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

export default function AudioUpload({ userId, folderId, onUploadComplete }: AudioUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<AudioProcessingResult | null>(null);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [generateMaterials, setGenerateMaterials] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const supportedLanguages = [
    { code: '', name: 'Auto-detect' },
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
  ];

  const validateAudioFile = (file: File): string | null => {
    if (!SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
      return 'Unsupported file format. Please upload MP3, M4A, WAV, WebM, or OGG files.';
    }
    
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 25MB.`;
    }
    
    return null;
  };

  const processAudioFile = async (file: File) => {
    if (!title.trim()) {
      alert('Please enter a title for your audio note');
      return;
    }

    const validationError = validateAudioFile(file);
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
      formData.append('audio', file);
      formData.append('userId', userId);
      formData.append('title', title.trim());
      if (folderId) formData.append('folderId', folderId);
      if (language) formData.append('language', language);
      formData.append('generateLearningMaterials', generateMaterials.toString());

      // 模拟进度更新（实际应用中可以使用WebSocket）
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
      
      // 可选：自动跳转到生成的笔记
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete(data.data.note.id);
        } else {
          router.push(`/notes/${data.data.note.id}`);
        }
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

  const handleFileSelect = (file: File) => {
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // 移除文件扩展名
    }
    processAudioFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  if (isProcessing || result) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-dark-secondary rounded-xl p-6 border border-dark-surface">
          <h3 className="text-xl font-semibold text-white mb-4">
            🎤 Audio Processing
          </h3>
          
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
                    <span className="capitalize text-xs">
                      {stage.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
              
              {progress.error && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400 font-medium">Error:</p>
                  <p className="text-red-300 text-sm mt-1">{progress.error}</p>
                  <button 
                    onClick={() => {
                      setIsProcessing(false);
                      setProgress(null);
                      setResult(null);
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {result && progress?.stage === 'complete' && (
            <div className="mt-6 space-y-4">
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
              
              <button 
                onClick={() => router.push(`/notes/${result.note.id}`)}
                className="w-full px-6 py-3 bg-mango-500 text-black font-semibold rounded-lg hover:bg-mango-400 transition-colors"
              >
                View Generated Note →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-dark-secondary rounded-xl p-6 border border-dark-surface">
        <h3 className="text-xl font-semibold text-white mb-6">
          🎤 Upload Audio File
        </h3>
        
        <div className="space-y-4">
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
              Generate flashcards and study materials
            </label>
          </div>

          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-mango-500 bg-mango-500/10' 
                : 'border-gray-600 hover:border-mango-500 hover:bg-mango-500/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-4xl">🎵</div>
              <div>
                <p className="text-white font-medium">
                  Drop your audio file here or click to browse
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Supports MP3, M4A, WAV, WebM, OGG (max 25MB)
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-mango-500 text-black font-semibold rounded-lg hover:bg-mango-400 transition-colors"
              >
                Choose Audio File
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Processing Info */}
        <div className="mt-6 text-xs text-gray-400 space-y-1">
          <p>• Audio will be transcribed using OpenAI Whisper</p>
          <p>• AI will analyze content and generate study materials</p>
          <p>• Processing typically takes 1-3 minutes depending on file size</p>
          <p>• Files are temporarily stored and automatically deleted after processing</p>
        </div>
      </div>
    </div>
  );
}