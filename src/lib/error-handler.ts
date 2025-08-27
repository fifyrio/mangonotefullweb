/**
 * Centralized error handling utilities
 */

export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export class ErrorHandler {
  /**
   * Convert technical errors to user-friendly messages
   */
  static getUserFriendlyMessage(error: Error): string {
    if (error instanceof AIError) {
      return error.userMessage
    }

    // Handle common API errors
    if (error.message.includes('OPENROUTER_API_KEY')) {
      return 'AI service is not configured. Please contact support.'
    }

    if (error.message.includes('timed out')) {
      return 'The AI service is taking longer than expected. Please try again.'
    }

    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.'
    }

    if (error.message.includes('insufficient funds') || error.message.includes('quota')) {
      return 'AI service quota exceeded. Please try again later.'
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network connection error. Please check your internet and try again.'
    }

    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return 'AI service returned an unexpected response. Please try again.'
    }

    // Generic fallback
    return 'An unexpected error occurred while processing your content. Please try again.'
  }

  /**
   * Determine if an error is retryable
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof AIError) {
      return error.retryable
    }

    // Retryable conditions
    const retryablePatterns = [
      'timed out',
      'network',
      'fetch',
      'rate limit',
      'server error',
      'service unavailable'
    ]

    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    )
  }

  /**
   * Log errors for debugging while protecting sensitive information
   */
  static logError(error: Error, context: string, metadata?: any) {
    const sanitizedMetadata = metadata ? {
      ...metadata,
      // Remove potentially sensitive information
      text: metadata.text ? `[${metadata.text.length} characters]` : undefined,
      content: metadata.content ? '[redacted]' : undefined
    } : undefined

    console.error(`[${context}] Error:`, {
      name: error.name,
      message: error.message,
      code: error instanceof AIError ? error.code : 'UNKNOWN',
      metadata: sanitizedMetadata,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }

  /**
   * Create standardized error response for API routes
   */
  static createErrorResponse(error: Error, statusCode: number = 500) {
    return {
      success: false,
      error: this.getUserFriendlyMessage(error),
      code: error instanceof AIError ? error.code : 'INTERNAL_ERROR',
      retryable: this.isRetryable(error),
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Specific AI-related errors
 */
export const AIErrors = {
  CONFIG_MISSING: new AIError(
    'OpenRouter API key not configured',
    'CONFIG_MISSING',
    'AI service is not properly configured. Please contact support.',
    false
  ),
  
  API_ERROR: new AIError(
    'OpenRouter API request failed',
    'API_ERROR', 
    'AI service is temporarily unavailable. Please try again.',
    true
  ),
  
  RATE_LIMITED: new AIError(
    'Rate limit exceeded',
    'RATE_LIMITED',
    'Too many requests. Please wait a moment and try again.',
    true
  ),
  
  TIMEOUT: new AIError(
    'Request timeout',
    'TIMEOUT',
    'AI analysis is taking too long. Please try with shorter content.',
    true
  ),
  
  PARSE_ERROR: new AIError(
    'Failed to parse AI response',
    'PARSE_ERROR',
    'AI service returned an unexpected response. Please try again.',
    true
  ),
  
  CONTENT_TOO_LARGE: new AIError(
    'Content exceeds size limit',
    'CONTENT_TOO_LARGE',
    'The content is too large to process. Please try with a smaller document.',
    false
  )
}