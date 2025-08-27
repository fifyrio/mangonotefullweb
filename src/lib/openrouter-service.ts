/**
 * OpenRouter AI Service Integration
 * Provides unified access to multiple AI models via OpenRouter API
 */

import { AIError, AIErrors, ErrorHandler } from './error-handler'

export interface OpenRouterResponse {
  summary: string
  key_points: string[]
  flashcards: Array<{
    question: string
    answer: string
  }>
  difficulty_level?: 'easy' | 'medium' | 'hard'
}

export interface OpenRouterError {
  error: string
  message: string
  code?: string
}

export class OpenRouterService {
  private readonly BASE_URL = 'https://openrouter.ai/api/v1'
  private readonly MODEL = 'anthropic/claude-3.5-sonnet' // Start with single model
  private readonly MAX_RETRIES = 3
  private readonly TIMEOUT_MS = 30000 // 30 seconds

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw AIErrors.CONFIG_MISSING
    }
  }

  /**
   * Analyze content and generate study materials
   */
  async analyzeContent(text: string): Promise<OpenRouterResponse> {
    if (!text || text.trim().length === 0) {
      throw new AIError('Empty content', 'EMPTY_CONTENT', 'Please provide content to analyze', false)
    }

    // Check content size limits
    const maxLength = 50000 // ~50k characters
    if (text.length > maxLength) {
      ErrorHandler.logError(AIErrors.CONTENT_TOO_LARGE, 'analyzeContent', { textLength: text.length })
      throw AIErrors.CONTENT_TOO_LARGE
    }

    const prompt = this.buildAnalysisPrompt(text)
    
    let lastError: Error | null = null
    
    // Retry logic for reliability
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`OpenRouter analysis attempt ${attempt}/${this.MAX_RETRIES}`)
        
        const response = await this.makeAPICall(prompt)
        const parsed = this.parseResponse(response)
        
        console.log('OpenRouter analysis successful:', {
          summaryLength: parsed.summary.length,
          keyPointsCount: parsed.key_points.length,
          flashcardsCount: parsed.flashcards.length
        })
        
        return parsed
      } catch (error) {
        lastError = error as Error
        ErrorHandler.logError(error as Error, `analyzeContent_attempt_${attempt}`, {
          textLength: text.length,
          attempt,
          maxRetries: this.MAX_RETRIES
        })
        
        if (attempt < this.MAX_RETRIES && ErrorHandler.isRetryable(error as Error)) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          console.log(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else if (attempt === this.MAX_RETRIES) {
          break
        }
      }
    }
    
    // Convert the final error to an appropriate AI error
    if (lastError) {
      if (lastError.message.includes('timeout')) {
        throw AIErrors.TIMEOUT
      } else if (lastError.message.includes('rate limit')) {
        throw AIErrors.RATE_LIMITED
      } else if (lastError.message.includes('parse') || lastError.message.includes('JSON')) {
        throw AIErrors.PARSE_ERROR
      } else {
        throw AIErrors.API_ERROR
      }
    }
    
    throw AIErrors.API_ERROR
  }

  /**
   * Generate flashcards only (for existing content)
   */
  async generateFlashcards(text: string, count: number = 5): Promise<Array<{question: string, answer: string}>> {
    const prompt = `Generate ${count} educational flashcards from this content. Focus on key concepts and important facts.

Content:
${text}

Return only a JSON array of flashcards:
[
  {"question": "What is...", "answer": "..."},
  {"question": "How does...", "answer": "..."}
]`

    const response = await this.makeAPICall(prompt)
    
    try {
      const flashcards = JSON.parse(response)
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array')
      }
      return flashcards
    } catch (error) {
      console.error('Failed to parse flashcards response:', response)
      throw new Error('Invalid flashcards response format')
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(text: string): string {
    return `Analyze the following content and create comprehensive study materials. Be thorough and educational.

CONTENT:
${text}

INSTRUCTIONS:
1. Create a clear, comprehensive summary (200-400 words)
2. Extract 5-8 key points as bullet points
3. Generate 5-7 educational flashcards covering important concepts
4. Assess difficulty level (easy/medium/hard)

Return your response in this EXACT JSON format (no markdown, no extra text):
{
  "summary": "Comprehensive summary here...",
  "key_points": [
    "First key point",
    "Second key point",
    "Third key point"
  ],
  "flashcards": [
    {"question": "What is the main concept?", "answer": "The main concept is..."},
    {"question": "How does this work?", "answer": "It works by..."}
  ],
  "difficulty_level": "medium"
}`
  }

  /**
   * Make API call to OpenRouter
   */
  private async makeAPICall(prompt: string): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS)

    try {
      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'MangoNote',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenRouter')
      }

      return data.choices[0].message.content
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenRouter request timed out after ${this.TIMEOUT_MS}ms`)
      }
      
      throw error
    }
  }

  /**
   * Parse and validate API response
   */
  private parseResponse(content: string): OpenRouterResponse {
    try {
      // Clean up response (remove markdown formatting if present)
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(cleanContent) as OpenRouterResponse
      
      // Validate required fields
      if (!parsed.summary || typeof parsed.summary !== 'string') {
        throw new Error('Missing or invalid summary')
      }
      
      if (!Array.isArray(parsed.key_points) || parsed.key_points.length === 0) {
        throw new Error('Missing or invalid key_points')
      }
      
      if (!Array.isArray(parsed.flashcards) || parsed.flashcards.length === 0) {
        throw new Error('Missing or invalid flashcards')
      }
      
      // Validate flashcards structure
      for (const card of parsed.flashcards) {
        if (!card.question || !card.answer || typeof card.question !== 'string' || typeof card.answer !== 'string') {
          throw new Error('Invalid flashcard structure')
        }
      }
      
      // Set default difficulty if not provided
      if (!parsed.difficulty_level) {
        parsed.difficulty_level = 'medium'
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse OpenRouter response:', content)
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get service health status
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.makeAPICall('Respond with "OK" if you receive this message.')
      return testResponse.toLowerCase().includes('ok')
    } catch (error) {
      console.error('OpenRouter health check failed:', error)
      return false
    }
  }
}