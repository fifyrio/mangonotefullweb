import axios from "axios"
import { ErrorHandler, AIError } from './error-handler'

interface TranscriptItem {
  text: string
  start: number
  duration: number
}

interface SupaDataTranscriptItem {
  lang: string
  text: string
  offset: number
  duration: number
}

interface SupaDataApiResponse {
  lang: string
  availableLangs: string[]
  content: SupaDataTranscriptItem[]
}

export interface YouTubeTranscriptResult {
  transcript: TranscriptItem[]
  language: string
  availableLanguages: string[]
  fullText: string
  duration: number
  videoId: string | null
}

export class YouTubeTranscriptService {
  private readonly apiKey: string
  private readonly baseUrl: string = "https://api.supadata.ai/v1"

  constructor() {
    this.apiKey = process.env.SUPADATA_API_KEY || "sd_bf1fe232e19f142584416666d4887aa3"

    if (!this.apiKey) {
      throw new Error("SUPADATA_API_KEY environment variable is required")
    }
  }

  /**
   * 获取YouTube视频的字幕
   * @param youtubeUrl - YouTube视频URL
   * @param language - 可选的语言代码
   * @returns 包含字幕数据的Promise
   */
  async getTranscript(youtubeUrl: string, language?: string): Promise<YouTubeTranscriptResult> {
    try {
      console.log("Fetching transcript from SupaData API", {
        url: youtubeUrl,
        language
      })

      // 验证URL
      if (!this.isValidYouTubeUrl(youtubeUrl)) {
        throw new AIError(
          'Invalid YouTube URL',
          'INVALID_YOUTUBE_URL',
          'Please provide a valid YouTube video URL',
          false
        )
      }

      const params: any = { url: youtubeUrl }
      if (language) {
        params.lang = language
      }

      const response = await axios.get(`${this.baseUrl}/transcript`, {
        params,
        headers: {
          "x-api-key": this.apiKey,
        },
        timeout: 30000, // 30秒超时
      })

      const data: SupaDataApiResponse = response.data

      if (!data.content || !Array.isArray(data.content)) {
        throw new AIError(
          'No transcript available',
          'NO_TRANSCRIPT',
          'This video does not have captions available or they cannot be accessed.',
          false
        )
      }

      // 转换API返回的格式到我们的内部格式
      const transcript: TranscriptItem[] = data.content.map((item) => ({
        text: item.text,
        start: item.offset / 1000, // 转换毫秒到秒
        duration: item.duration / 1000, // 转换毫秒到秒
      }))

      const fullText = this.transcriptToText(transcript)
      const duration = this.getTranscriptDuration(transcript)
      const videoId = this.extractVideoId(youtubeUrl)

      console.log("Successfully fetched YouTube transcript", {
        url: youtubeUrl,
        transcriptLength: transcript.length,
        language: data.lang,
        availableLanguages: data.availableLangs,
        textLength: fullText.length,
        duration
      })

      return {
        transcript,
        language: data.lang,
        availableLanguages: data.availableLangs,
        fullText,
        duration,
        videoId
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'youtube_transcript_fetch', {
        url: youtubeUrl,
        language
      })

      // 处理不同类型的错误
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // API返回了错误响应
          const status = error.response.status
          const errorData = error.response.data

          if (status === 404) {
            throw new AIError(
              'Video not found',
              'VIDEO_NOT_FOUND',
              'Video not found or captions not available for this video.',
              false
            )
          } else if (status === 401 || status === 403) {
            throw new AIError(
              'API authentication failed',
              'API_AUTH_FAILED',
              'YouTube transcript service authentication failed.',
              true
            )
          } else if (status === 429) {
            throw new AIError(
              'Rate limit exceeded',
              'RATE_LIMIT',
              'Too many requests. Please try again later.',
              true
            )
          } else if (status >= 500) {
            throw new AIError(
              'Service unavailable',
              'SERVICE_UNAVAILABLE',
              'YouTube transcript service is temporarily unavailable.',
              true
            )
          } else {
            throw new AIError(
              'API request failed',
              'API_ERROR',
              errorData?.message || errorData?.error || 'Failed to fetch transcript.',
              true
            )
          }
        } else if (error.request) {
          // 网络错误
          throw new AIError(
            'Network error',
            'NETWORK_ERROR',
            'Unable to reach YouTube transcript service.',
            true
          )
        }
      }

      // 如果是我们自定义的错误，直接重新抛出
      if (error instanceof AIError) {
        throw error
      }

      // 其他未知错误
      throw new AIError(
        'Unknown error',
        'UNKNOWN_ERROR',
        'An unexpected error occurred while fetching the transcript.',
        true
      )
    }
  }

  /**
   * 将transcript数组转换为连续文本
   * @param transcript - transcript数组
   * @returns 连续的文本字符串
   */
  transcriptToText(transcript: TranscriptItem[]): string {
    return transcript
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
  }

  /**
   * 从URL中提取YouTube视频ID
   * @param url - YouTube视频URL
   * @returns 视频ID或null
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      // 各种YouTube URL格式
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // 直接的视频ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  /**
   * 验证YouTube URL格式
   * @param url - YouTube视频URL
   * @returns 是否为有效的YouTube URL
   */
  isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null
  }

  /**
   * 获取transcript的总时长
   * @param transcript - transcript数组
   * @returns 总时长（秒）
   */
  getTranscriptDuration(transcript: TranscriptItem[]): number {
    if (!transcript || transcript.length === 0) return 0

    const lastItem = transcript[transcript.length - 1]
    return lastItem.start + lastItem.duration
  }

  /**
   * 根据时间范围过滤transcript
   * @param transcript - transcript数组
   * @param startTime - 开始时间（秒）
   * @param endTime - 结束时间（秒）
   * @returns 过滤后的transcript数组
   */
  filterTranscriptByTime(
    transcript: TranscriptItem[],
    startTime: number,
    endTime: number
  ): TranscriptItem[] {
    return transcript.filter(
      (item) => item.start >= startTime && item.start + item.duration <= endTime
    )
  }

  /**
   * 获取视频的可用语言列表
   * @param youtubeUrl - YouTube视频URL
   * @returns 可用语言列表
   */
  async getAvailableLanguages(youtubeUrl: string): Promise<string[]> {
    try {
      const result = await this.getTranscript(youtubeUrl)
      return result.availableLanguages
    } catch (error) {
      ErrorHandler.logError(error as Error, 'youtube_get_languages', {
        url: youtubeUrl
      })
      throw error
    }
  }

  /**
   * 检查API健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      // 使用一个已知的YouTube视频来测试API
      const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      const response = await axios.get(`${this.baseUrl}/transcript`, {
        params: { url: testUrl },
        headers: {
          "x-api-key": this.apiKey,
        },
        timeout: 5000,
      })

      return response.status === 200
    } catch (error) {
      console.warn("YouTube transcript service health check failed", {
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  /**
   * 格式化时间戳为可读格式
   * @param seconds - 秒数
   * @returns 格式化的时间字符串 (HH:MM:SS)
   */
  formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }

  /**
   * 获取带时间戳的字幕文本
   * @param transcript - transcript数组
   * @returns 带时间戳的格式化文本
   */
  getFormattedTranscriptWithTimestamps(transcript: TranscriptItem[]): string {
    return transcript
      .map(item => `[${this.formatTimestamp(item.start)}] ${item.text}`)
      .join('\n')
  }

  /**
   * 创建字幕段落（将相近的字幕合并）
   * @param transcript - transcript数组
   * @param maxGapSeconds - 最大间隔秒数，超过此间隔将分段
   * @returns 分段后的字幕数组
   */
  createTranscriptSegments(transcript: TranscriptItem[], maxGapSeconds: number = 3): Array<{
    text: string
    startTime: number
    endTime: number
    duration: number
  }> {
    if (transcript.length === 0) return []

    const segments: Array<{
      text: string
      startTime: number
      endTime: number
      duration: number
    }> = []

    let currentSegment = {
      texts: [transcript[0].text],
      startTime: transcript[0].start,
      endTime: transcript[0].start + transcript[0].duration
    }

    for (let i = 1; i < transcript.length; i++) {
      const item = transcript[i]
      const gap = item.start - currentSegment.endTime

      if (gap <= maxGapSeconds) {
        // 合并到当前段落
        currentSegment.texts.push(item.text)
        currentSegment.endTime = item.start + item.duration
      } else {
        // 创建新段落
        segments.push({
          text: currentSegment.texts.join(' '),
          startTime: currentSegment.startTime,
          endTime: currentSegment.endTime,
          duration: currentSegment.endTime - currentSegment.startTime
        })

        currentSegment = {
          texts: [item.text],
          startTime: item.start,
          endTime: item.start + item.duration
        }
      }
    }

    // 添加最后一个段落
    segments.push({
      text: currentSegment.texts.join(' '),
      startTime: currentSegment.startTime,
      endTime: currentSegment.endTime,
      duration: currentSegment.endTime - currentSegment.startTime
    })

    return segments
  }
}