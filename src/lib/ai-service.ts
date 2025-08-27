// Real AI service powered by OpenRouter
import { OpenRouterService, type OpenRouterResponse } from './openrouter-service'

export interface AnalysisItem {
  type: string
  title: string
  content: any
  icon?: string
  icon_color?: string
  sort_order?: number
}

export interface Flashcard {
  question: string
  answer: string
}

export class AIService {
  private openRouter: OpenRouterService

  constructor() {
    try {
      this.openRouter = new OpenRouterService()
    } catch (error) {
      console.error('Failed to initialize OpenRouter service:', error)
      throw new Error('AI service initialization failed. Please check configuration.')
    }
  }

  async analyzeContent(text: string): Promise<AnalysisItem[]> {
    try {
      console.log('Starting AI analysis...', { textLength: text.length })
      
      // Get real AI analysis
      const aiResponse = await this.openRouter.analyzeContent(text)
      
      console.log('AI analysis completed successfully')
      
      // Convert to our database format
      return this.formatAnalysisForDatabase(aiResponse, text)
    } catch (error) {
      console.error('AI analysis failed:', error)
      
      // Fallback to basic analysis if AI fails
      console.log('Using fallback analysis due to AI error')
      return this.fallbackAnalysis(text, error as Error)
    }
  }

  async generateFlashcards(text: string): Promise<Flashcard[]> {
    try {
      console.log('Generating flashcards with AI...', { textLength: text.length })
      
      const flashcards = await this.openRouter.generateFlashcards(text, 5)
      
      console.log('AI flashcard generation completed:', { count: flashcards.length })
      
      return flashcards
    } catch (error) {
      console.error('AI flashcard generation failed:', error)
      
      // Fallback to simple flashcards
      return this.fallbackFlashcards(text)
    }
  }

  /**
   * Convert OpenRouter response to database format
   */
  private formatAnalysisForDatabase(aiResponse: OpenRouterResponse, originalText: string): AnalysisItem[] {
    const words = originalText.split(' ').length
    
    return [
      // Title extraction
      {
        type: 'title',
        title: 'Document Title',
        content: { title: this.extractTitle(originalText) },
        sort_order: 0
      },
      // AI-generated summary
      {
        type: 'summary',
        title: 'AI Summary',
        content: { 
          text: aiResponse.summary,
          word_count: words,
          estimated_reading_time: Math.ceil(words / 200),
          ai_generated: true,
          difficulty_level: aiResponse.difficulty_level
        },
        icon: '🤖',
        icon_color: '#3B82F6',
        sort_order: 1
      },
      // AI-extracted key points
      {
        type: 'key_points',
        title: 'Key Points',
        content: {
          points: aiResponse.key_points,
          ai_generated: true
        },
        icon: '🔑',
        icon_color: '#10B981',
        sort_order: 2
      },
      // Study questions derived from flashcards
      {
        type: 'questions',
        title: 'Study Questions',
        content: {
          questions: aiResponse.flashcards.map(card => card.question),
          ai_generated: true
        },
        icon: '❓',
        icon_color: '#8B5CF6',
        sort_order: 3
      }
    ]
  }

  /**
   * Fallback analysis when AI fails
   */
  private fallbackAnalysis(text: string, error: Error): AnalysisItem[] {
    const words = text.split(' ').length
    
    return [
      {
        type: 'title',
        title: 'Document Title',
        content: { title: this.extractTitle(text) },
        sort_order: 0
      },
      {
        type: 'error',
        title: 'AI Analysis Unavailable',
        content: { 
          message: 'AI analysis temporarily unavailable. Showing basic analysis.',
          error: error.message,
          fallback: true
        },
        icon: '⚠️',
        icon_color: '#F59E0B',
        sort_order: 1
      },
      {
        type: 'summary',
        title: 'Basic Summary',
        content: { 
          text: this.generateBasicSummary(text),
          word_count: words,
          estimated_reading_time: Math.ceil(words / 200),
          ai_generated: false
        },
        icon: '📄',
        icon_color: '#6B7280',
        sort_order: 2
      }
    ]
  }

  /**
   * Fallback flashcards when AI fails
   */
  private fallbackFlashcards(text: string): Flashcard[] {
    const keyTerms = this.extractKeyTerms(text)
    return keyTerms.slice(0, 3).map(term => ({
      question: `What is the significance of "${term}" in this content?`,
      answer: `${term} appears to be an important concept in the document. Review the content for more details.`
    }))
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<{ available: boolean; message: string }> {
    try {
      const isHealthy = await this.openRouter.healthCheck()
      return {
        available: isHealthy,
        message: isHealthy ? 'AI service is operational' : 'AI service is experiencing issues'
      }
    } catch (error) {
      return {
        available: false,
        message: `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Utility methods for fallback and basic analysis
  
  private extractTitle(text: string): string {
    // Simple title extraction - first line or first 50 characters
    const firstLine = text.split('\n')[0].trim()
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine
    }
    return text.substring(0, 50).trim() + '...'
  }

  private generateBasicSummary(text: string): string {
    // Simple summary generation - first paragraph or first 200 words
    const firstParagraph = text.split('\n\n')[0]
    if (firstParagraph.length > 0) {
      return firstParagraph.length > 500 
        ? firstParagraph.substring(0, 500) + '...'
        : firstParagraph
    }
    
    const words = text.split(' ').slice(0, 50).join(' ')
    return words + '...'
  }

  private extractKeyTerms(text: string): string[] {
    // Simple key terms extraction - look for capitalized words and repeated terms
    const words = text.split(/\s+/)
    const termCounts: { [key: string]: number } = {}
    
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '').toLowerCase()
      if (cleaned.length > 3 && cleaned.length < 20) {
        termCounts[cleaned] = (termCounts[cleaned] || 0) + 1
      }
    })
    
    return Object.entries(termCounts)
      .filter(([_, count]) => count > 1)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([term, _]) => term)
  }
}