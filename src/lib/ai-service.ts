// Mock AI service for PDF content analysis
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
  async analyzeContent(text: string): Promise<AnalysisItem[]> {
    // Mock AI analysis - in production this would call actual AI services
    const words = text.split(' ').length
    const sentences = text.split('.').length
    
    return [
      {
        type: 'title',
        title: 'Document Title',
        content: { title: this.extractTitle(text) },
        sort_order: 0
      },
      {
        type: 'summary',
        title: 'Summary',
        content: { 
          text: this.generateSummary(text),
          word_count: words,
          estimated_reading_time: Math.ceil(words / 200)
        },
        icon: '📄',
        icon_color: '#3B82F6',
        sort_order: 1
      },
      {
        type: 'key_points',
        title: 'Key Points',
        content: {
          points: this.extractKeyPoints(text)
        },
        icon: '🔑',
        icon_color: '#10B981',
        sort_order: 2
      },
      {
        type: 'questions',
        title: 'Study Questions',
        content: {
          questions: this.generateStudyQuestions(text)
        },
        icon: '❓',
        icon_color: '#8B5CF6',
        sort_order: 3
      }
    ]
  }

  async generateFlashcards(text: string): Promise<Flashcard[]> {
    // Mock flashcard generation
    const keyTerms = this.extractKeyTerms(text)
    return keyTerms.map(term => ({
      question: `What is ${term}?`,
      answer: `${term} is an important concept from the document.`
    }))
  }

  private extractTitle(text: string): string {
    // Simple title extraction - first line or first 50 characters
    const firstLine = text.split('\n')[0].trim()
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine
    }
    return text.substring(0, 50).trim() + '...'
  }

  private generateSummary(text: string): string {
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

  private extractKeyPoints(text: string): string[] {
    // Simple key points extraction based on sentence patterns
    const sentences = text.split('.').filter(s => s.trim().length > 20)
    const keyPoints = sentences
      .slice(0, 5)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    
    return keyPoints.length > 0 ? keyPoints : ['Key insights from the document content']
  }

  private generateStudyQuestions(text: string): string[] {
    // Simple study questions generation
    return [
      'What are the main concepts discussed in this document?',
      'How do the ideas presented relate to each other?',
      'What are the practical applications of this information?',
      'What questions does this content raise for further study?'
    ]
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