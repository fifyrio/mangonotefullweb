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
   * Build comprehensive analysis prompt with improved pedagogy
   */
  private buildAnalysisPrompt(text: string): string {
    const truncatedText = text.substring(0, 10000)
    const wordCount = text.split(/\s+/).length
    const estimatedReadingTime = Math.max(Math.ceil(wordCount / 200), 5) // 200 WPM average
    
    return `You are an expert educational content analyzer and learning specialist. Transform this content into comprehensive, pedagogically sound study materials that maximize learning effectiveness.

**CONTENT TO ANALYZE:**
${truncatedText}${text.length > 10000 ? '\n\n[Content continues - analyze the full scope]' : ''}

**YOUR MISSION:**
Create study materials that help students:
- **Understand** core concepts deeply
- **Apply** knowledge practically  
- **Remember** information long-term
- **Succeed** in assessments

**REQUIRED OUTPUT FORMAT:**
Return ONLY valid JSON with no markdown formatting or extra text:

{
  "summary": "Write a comprehensive, well-structured summary that captures all major concepts, their relationships, and significance. Use clear topic sentences and logical flow. Make it digestible yet thorough (400-600 words).",
  "key_points": [
    "Specific, actionable insight with concrete details and context",
    "Clear principle that students can apply immediately with examples", 
    "Important concept with real-world relevance and implications",
    "Critical understanding that connects to broader themes",
    "Advanced insight for deeper comprehension (if applicable)",
    "Practical takeaway with implementation guidance"
  ],
  "flashcards": [
    {"question": "What is the primary concept or principle explained in this content?", "answer": "Provide a clear, complete answer that demonstrates understanding"},
    {"question": "How would you apply this knowledge in a real-world scenario?", "answer": "Give specific, practical application examples"},
    {"question": "What are the key relationships between the main concepts discussed?", "answer": "Explain how ideas connect and influence each other"},
    {"question": "What potential challenges or limitations should be considered?", "answer": "Address critical thinking about constraints and edge cases"},
    {"question": "Why is this information important or significant?", "answer": "Explain the broader context and implications"},
    {"question": "What examples or analogies help explain this concept?", "answer": "Provide memorable comparisons or concrete examples"}
  ],
  "difficulty_level": "easy|medium|hard"
}

**QUALITY STANDARDS:**
- **Clarity**: Use precise, accessible language
- **Depth**: Go beyond surface-level to meaningful insights
- **Structure**: Organize information logically
- **Engagement**: Make content interesting and relevant
- **Accuracy**: Ensure all information is factually correct
- **Completeness**: Cover all significant topics without redundancy

Generate materials that would help someone master this content efficiently and thoroughly. Focus on learning outcomes, not just information transfer.`
  }

  /**
   * Make API call to OpenRouter (public method for mind map service)
   */
  async makeAPICall(prompt: string): Promise<string> {
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