/**
 * OpenAI Whisper Audio Transcription Service
 * 高级音频处理：MP3转录、多语言支持、错误处理
 */

import OpenAI from 'openai';

interface TranscriptionOptions {
  language?: string; // 语言代码，如 'en', 'zh', 'ja' 等
  prompt?: string; // 提示文本，提高转录准确性
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1，控制随机性
}

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
}

interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface AudioProcessingProgress {
  stage: 'uploading' | 'preprocessing' | 'transcribing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export class WhisperService {
  private openai: OpenAI;
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for Whisper API
  private readonly SUPPORTED_FORMATS = [
    'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'
  ];

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * 验证音频文件
   */
  private validateAudioFile(file: File): void {
    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of 25MB`);
    }

    // 检查文件格式
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
      throw new Error(`Unsupported file format: ${extension}. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`);
    }
  }

  /**
   * 检测音频语言（基于文件名或内容）
   */
  private detectLanguage(filename: string): string | undefined {
    const lowerName = filename.toLowerCase();
    
    // 基于文件名的简单语言检测
    if (lowerName.includes('chinese') || lowerName.includes('中文') || lowerName.includes('zh')) {
      return 'zh';
    }
    if (lowerName.includes('japanese') || lowerName.includes('日本') || lowerName.includes('ja')) {
      return 'ja';
    }
    if (lowerName.includes('korean') || lowerName.includes('한국') || lowerName.includes('ko')) {
      return 'ko';
    }
    if (lowerName.includes('spanish') || lowerName.includes('español') || lowerName.includes('es')) {
      return 'es';
    }
    if (lowerName.includes('french') || lowerName.includes('français') || lowerName.includes('fr')) {
      return 'fr';
    }
    
    // 默认返回undefined，让Whisper自动检测
    return undefined;
  }

  /**
   * 转录音频文件（基础版本）
   */
  async transcribeAudio(
    file: File, 
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      // 验证文件
      this.validateAudioFile(file);

      // 自动检测语言（如果未指定）
      if (!options.language) {
        options.language = this.detectLanguage(file.name);
      }

      // 转换File为FormData格式
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('response_format', options.response_format || 'verbose_json');

      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }

      // 调用OpenAI Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        response_format: options.response_format || 'verbose_json',
        temperature: options.temperature || 0,
      });

      // 处理响应
      if (options.response_format === 'verbose_json') {
        const verboseResponse = response as any;
        return {
          text: verboseResponse.text,
          language: verboseResponse.language,
          duration: verboseResponse.duration,
          segments: verboseResponse.segments,
        };
      } else {
        return {
          text: typeof response === 'string' ? response : response.text,
        };
      }

    } catch (error) {
      console.error('Whisper transcription error:', error);
      
      if (error instanceof Error) {
        throw new Error(`Audio transcription failed: ${error.message}`);
      }
      throw new Error('Audio transcription failed: Unknown error');
    }
  }

  /**
   * 高级音频处理（带进度跟踪）
   */
  async processAudioAdvanced(
    file: File,
    options: TranscriptionOptions = {},
    onProgress?: (progress: AudioProcessingProgress) => void
  ): Promise<{
    transcription: TranscriptionResult;
    analysis: any;
  }> {
    try {
      // 阶段1：文件上传和验证
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: 'Validating audio file...'
      });

      this.validateAudioFile(file);

      // 阶段2：预处理
      onProgress?.({
        stage: 'preprocessing',
        progress: 20,
        message: 'Preparing audio for transcription...'
      });

      // 检测语言和优化参数
      if (!options.language) {
        options.language = this.detectLanguage(file.name);
      }

      // 阶段3：转录
      onProgress?.({
        stage: 'transcribing',
        progress: 40,
        message: 'Transcribing audio with Whisper...'
      });

      const transcription = await this.transcribeAudio(file, {
        ...options,
        response_format: 'verbose_json' // 获取详细信息
      });

      // 阶段4：内容分析（可选）
      onProgress?.({
        stage: 'analyzing',
        progress: 80,
        message: 'Analyzing transcribed content...'
      });

      // 基础内容分析
      const analysis = this.analyzeTranscription(transcription);

      // 阶段5：完成
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Audio processing complete!'
      });

      return {
        transcription,
        analysis
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Audio processing failed',
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * 分析转录内容
   */
  private analyzeTranscription(transcription: TranscriptionResult) {
    const text = transcription.text;
    
    return {
      // 基础统计
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      duration: transcription.duration,
      
      // 语言信息
      detectedLanguage: transcription.language,
      
      // 质量指标
      averageConfidence: transcription.segments 
        ? transcription.segments.reduce((acc, seg) => acc + (1 - seg.no_speech_prob), 0) / transcription.segments.length
        : undefined,
      
      // 时间戳信息
      hasTimestamps: !!transcription.segments,
      segmentCount: transcription.segments?.length || 0,
      
      // 内容预览
      preview: text.length > 200 ? text.substring(0, 200) + '...' : text,
    };
  }

  /**
   * 生成字幕文件（SRT格式）
   */
  async generateSubtitles(file: File, language?: string): Promise<string> {
    try {
      const result = await this.transcribeAudio(file, {
        language,
        response_format: 'srt'
      });
      
      return result.text;
    } catch (error) {
      throw new Error(`Subtitle generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 批量音频处理
   */
  async processBatchAudio(
    files: File[],
    options: TranscriptionOptions = {}
  ): Promise<Array<{
    filename: string;
    success: boolean;
    result?: TranscriptionResult;
    error?: string;
  }>> {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.transcribeAudio(file, options);
        results.push({
          filename: file.name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): Array<{code: string, name: string}> {
    return [
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
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
    ];
  }
}

// 导出单例实例
export const whisperService = new WhisperService();