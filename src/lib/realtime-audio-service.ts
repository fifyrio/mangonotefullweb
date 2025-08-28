/**
 * Real-time Audio Processing Service
 * 实时音频处理：流式转录、会议记录、语音命令
 */

import { whisperService } from '@/lib/whisper-service';

export interface RealtimeAudioConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  chunkDuration: number; // seconds
  language?: string;
  enableVoiceCommands?: boolean;
  enableMeetingMode?: boolean;
}

export interface TranscriptionChunk {
  id: string;
  timestamp: number;
  text: string;
  confidence?: number;
  isFinal: boolean;
  speaker?: string;
}

export interface VoiceCommand {
  command: string;
  confidence: number;
  timestamp: number;
  parameters?: Record<string, any>;
}

export interface MeetingSegment {
  id: string;
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

export interface RealtimeAudioEvents {
  onTranscriptionChunk: (chunk: TranscriptionChunk) => void;
  onVoiceCommand: (command: VoiceCommand) => void;
  onError: (error: Error) => void;
  onStatusChange: (status: 'idle' | 'listening' | 'processing' | 'error') => void;
}

export class RealtimeAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private isRecording = false;
  private audioChunks: Blob[] = [];
  private config: RealtimeAudioConfig;
  private events: RealtimeAudioEvents;
  private chunkCounter = 0;
  private processingTimeout: NodeJS.Timeout | null = null;

  // Voice commands patterns
  private readonly VOICE_COMMANDS = {
    'start recording': { action: 'start_recording', confidence: 0.8 },
    'stop recording': { action: 'stop_recording', confidence: 0.8 },
    'pause recording': { action: 'pause_recording', confidence: 0.8 },
    'resume recording': { action: 'resume_recording', confidence: 0.8 },
    'save note': { action: 'save_note', confidence: 0.8 },
    'create flashcard': { action: 'create_flashcard', confidence: 0.7 },
    'new section': { action: 'new_section', confidence: 0.7 },
    'summarize': { action: 'summarize', confidence: 0.7 },
  };

  constructor(config: Partial<RealtimeAudioConfig>, events: RealtimeAudioEvents) {
    this.config = {
      sampleRate: 16000,
      channels: 1,
      bufferSize: 4096,
      chunkDuration: 3, // 3 seconds chunks
      language: 'en',
      enableVoiceCommands: true,
      enableMeetingMode: false,
      ...config
    };
    this.events = events;
  }

  /**
   * 初始化音频录制
   */
  async initialize(): Promise<void> {
    try {
      console.log('Requesting microphone access...');
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('Microphone access granted');

      // Create audio context for processing
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });
      console.log('Audio context created');

      // Setup MediaRecorder with optimal settings
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus'
      };

      // Fallback for different browsers
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('opus not supported, trying mp4');
        options.mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('mp4 not supported, trying wav');
        options.mimeType = 'audio/wav';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('wav not supported, using default');
        delete options.mimeType;
      }
      
      console.log('Using MIME type:', options.mimeType || 'default');

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.setupRecorderEvents();
      console.log('MediaRecorder created and events setup');

      this.events.onStatusChange('idle');
      console.log('Real-time audio service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to access microphone';
      this.events.onError(new Error(errorMsg));
      throw error;
    }
  }

  /**
   * 设置录制器事件处理
   */
  private setupRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      if (this.audioChunks.length > 0) {
        await this.processAudioChunk();
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      this.events.onError(new Error('Recording failed'));
    };
  }

  /**
   * 开始实时录制
   */
  async startRecording(): Promise<void> {
    console.log('startRecording called, mediaRecorder:', !!this.mediaRecorder, 'isRecording:', this.isRecording);
    
    if (!this.mediaRecorder) {
      throw new Error('Cannot start recording: MediaRecorder not initialized');
    }
    
    if (this.isRecording) {
      throw new Error('Cannot start recording: already recording');
    }

    try {
      this.audioChunks = [];
      this.chunkCounter = 0;
      this.isRecording = true;
      
      console.log('Starting MediaRecorder with chunk duration:', this.config.chunkDuration * 1000, 'ms');
      
      // Start recording in chunks
      this.mediaRecorder.start(this.config.chunkDuration * 1000);
      this.events.onStatusChange('listening');
      
      // Setup automatic chunk processing
      this.scheduleChunkProcessing();
      
      console.log('Started real-time recording successfully');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false; // Reset state on error
      this.events.onError(error as Error);
      throw error;
    }
  }

  /**
   * 停止录制
   */
  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) return;

    try {
      this.isRecording = false;
      this.mediaRecorder.stop();
      
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
        this.processingTimeout = null;
      }
      
      this.events.onStatusChange('idle');
      console.log('Stopped real-time recording');
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.events.onError(error as Error);
    }
  }

  /**
   * 暂停录制
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      this.events.onStatusChange('idle');
    }
  }

  /**
   * 恢复录制
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.resume();
      this.events.onStatusChange('listening');
    }
  }

  /**
   * 定期处理音频块
   */
  private scheduleChunkProcessing(): void {
    if (!this.isRecording) return;

    this.processingTimeout = setTimeout(async () => {
      if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        // Request data from current recording
        this.mediaRecorder.requestData();
        
        // Schedule next chunk
        this.scheduleChunkProcessing();
      }
    }, this.config.chunkDuration * 1000);
  }

  /**
   * 处理音频块并进行转录
   */
  private async processAudioChunk(): Promise<void> {
    if (this.audioChunks.length === 0) return;

    try {
      this.events.onStatusChange('processing');
      
      // Combine audio chunks
      const audioBlob = new Blob(this.audioChunks, { 
        type: this.mediaRecorder?.mimeType || 'audio/webm' 
      });
      
      // Convert blob to file for Whisper API
      const audioFile = new File([audioBlob], `chunk-${this.chunkCounter}.webm`, {
        type: audioBlob.type
      });

      // Skip very small chunks (likely silence)
      if (audioFile.size < 1000) { // Less than 1KB
        this.audioChunks = [];
        this.events.onStatusChange(this.isRecording ? 'listening' : 'idle');
        return;
      }

      try {
        // Transcribe audio chunk
        const transcription = await whisperService.transcribeAudio(audioFile, {
          language: this.config.language,
          response_format: 'verbose_json'
        });

        // Create transcription chunk
        const chunk: TranscriptionChunk = {
          id: `chunk-${this.chunkCounter}`,
          timestamp: Date.now(),
          text: transcription.text.trim(),
          confidence: this.calculateConfidence(transcription),
          isFinal: true
        };

        // Skip empty or very short transcriptions
        if (chunk.text.length > 3) {
          this.events.onTranscriptionChunk(chunk);
          
          // Check for voice commands
          if (this.config.enableVoiceCommands) {
            this.detectVoiceCommands(chunk.text);
          }
        }

      } catch (transcriptionError) {
        console.warn('Transcription failed for chunk:', transcriptionError);
        // Don't throw, just continue with next chunk
      }

      // Reset for next chunk
      this.audioChunks = [];
      this.chunkCounter++;
      this.events.onStatusChange(this.isRecording ? 'listening' : 'idle');
      
    } catch (error) {
      console.error('Failed to process audio chunk:', error);
      this.events.onError(error as Error);
    }
  }

  /**
   * 计算转录置信度
   */
  private calculateConfidence(transcription: any): number {
    if (transcription.segments && transcription.segments.length > 0) {
      const avgLogProb = transcription.segments.reduce((sum: number, seg: any) => 
        sum + (seg.avg_logprob || -1), 0) / transcription.segments.length;
      
      // Convert log probability to confidence (0-1)
      return Math.max(0, Math.min(1, Math.exp(avgLogProb)));
    }
    return 0.5; // Default confidence
  }

  /**
   * 检测语音命令
   */
  private detectVoiceCommands(text: string): void {
    const lowerText = text.toLowerCase().trim();
    
    for (const [phrase, config] of Object.entries(this.VOICE_COMMANDS)) {
      if (lowerText.includes(phrase)) {
        const command: VoiceCommand = {
          command: config.action,
          confidence: config.confidence,
          timestamp: Date.now(),
          parameters: { originalText: text }
        };
        
        this.events.onVoiceCommand(command);
        console.log('Voice command detected:', command);
        break; // Only trigger first match
      }
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): 'idle' | 'listening' | 'processing' | 'error' {
    if (!this.mediaRecorder) return 'error';
    if (!this.isRecording) return 'idle';
    if (this.audioChunks.length > 0) return 'processing';
    return 'listening';
  }

  /**
   * 检查浏览器支持
   */
  static isSupported(): boolean {
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    const hasMediaRecorder = !!window.MediaRecorder;
    const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
    
    console.log('Browser support check:', {
      hasMediaDevices,
      hasGetUserMedia, 
      hasMediaRecorder,
      hasAudioContext
    });
    
    return hasMediaDevices && hasGetUserMedia && hasMediaRecorder && hasAudioContext;
  }

  /**
   * 获取可用音频设备
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopRecording();
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }
}

// Meeting-specific utilities
export class MeetingRecorder {
  private realtimeService: RealtimeAudioService;
  private segments: MeetingSegment[] = [];
  private currentSpeaker = 'Speaker';
  private segmentStartTime = 0;
  private accumulatedText = '';

  constructor(config?: Partial<RealtimeAudioConfig>) {
    this.realtimeService = new RealtimeAudioService(
      { ...config, enableMeetingMode: true },
      {
        onTranscriptionChunk: this.handleTranscriptionChunk.bind(this),
        onVoiceCommand: this.handleVoiceCommand.bind(this),
        onError: (error) => console.error('Meeting recording error:', error),
        onStatusChange: (status) => console.log('Meeting status:', status)
      }
    );
  }

  async startMeeting(): Promise<void> {
    await this.realtimeService.initialize();
    await this.realtimeService.startRecording();
    this.segmentStartTime = Date.now();
  }

  async endMeeting(): Promise<MeetingSegment[]> {
    await this.realtimeService.stopRecording();
    
    // Finalize last segment
    if (this.accumulatedText.trim()) {
      this.finalizeCurrentSegment();
    }
    
    return this.segments;
  }

  private handleTranscriptionChunk(chunk: TranscriptionChunk): void {
    this.accumulatedText += ' ' + chunk.text;
    
    // Detect speaker changes or long pauses (simplified)
    if (this.accumulatedText.length > 200 || chunk.text.includes('.')) {
      this.finalizeCurrentSegment();
    }
  }

  private handleVoiceCommand(command: VoiceCommand): void {
    if (command.command === 'new_section') {
      this.finalizeCurrentSegment();
    }
  }

  private finalizeCurrentSegment(): void {
    if (!this.accumulatedText.trim()) return;

    const segment: MeetingSegment = {
      id: `segment-${this.segments.length}`,
      speaker: this.currentSpeaker,
      startTime: this.segmentStartTime,
      endTime: Date.now(),
      text: this.accumulatedText.trim(),
      confidence: 0.8 // Simplified
    };

    this.segments.push(segment);
    
    // Reset for next segment
    this.accumulatedText = '';
    this.segmentStartTime = Date.now();
  }

  dispose(): void {
    this.realtimeService.dispose();
  }
}