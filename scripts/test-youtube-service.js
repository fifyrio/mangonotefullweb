#!/usr/bin/env node

/**
 * Test script for YouTube Transcript Service
 * Usage: node scripts/test-youtube-service.js
 */

const axios = require('axios')

// Mock YouTube Transcript Service for testing
class YouTubeTranscriptServiceTest {
  constructor() {
    this.apiKey = process.env.SUPADATA_API_KEY || "sd_bf1fe232e19f142584416666d4887aa3"
    this.baseUrl = "https://api.supadata.ai/v1"
  }

  async testService() {
    console.log('🧪 Testing YouTube Transcript Service...\n')

    // Test URLs
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll (known to have captions)
      'https://youtu.be/dQw4w9WgXcQ', // Short format
      'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Popular educational video
    ]

    for (const url of testUrls) {
      console.log(`📹 Testing URL: ${url}`)
      
      try {
        const result = await this.getTranscript(url)
        console.log('✅ Success!')
        console.log(`   - Language: ${result.lang}`)
        console.log(`   - Available Languages: ${result.availableLangs?.join(', ') || 'None'}`)
        console.log(`   - Transcript Length: ${result.content?.length || 0} segments`)
        
        if (result.content && result.content.length > 0) {
          const firstSegment = result.content[0]
          console.log(`   - First segment: "${firstSegment.text.substring(0, 50)}..."`)
          console.log(`   - First segment time: ${(firstSegment.offset / 1000).toFixed(2)}s`)
        }
        
        console.log('')
      } catch (error) {
        console.log('❌ Failed!')
        console.log(`   - Error: ${error.message}`)
        console.log('')
      }
    }

    // Test health check
    console.log('🔍 Testing service health check...')
    try {
      const isHealthy = await this.checkHealth()
      console.log(isHealthy ? '✅ Service is healthy' : '⚠️ Service might be unavailable')
    } catch (error) {
      console.log('❌ Health check failed:', error.message)
    }
    
    console.log('\n🎉 Test completed!')
  }

  async getTranscript(youtubeUrl) {
    const response = await axios.get(`${this.baseUrl}/transcript`, {
      params: { url: youtubeUrl },
      headers: {
        "x-api-key": this.apiKey,
      },
      timeout: 10000,
    })

    return response.data
  }

  async checkHealth() {
    const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    const response = await axios.get(`${this.baseUrl}/transcript`, {
      params: { url: testUrl },
      headers: {
        "x-api-key": this.apiKey,
      },
      timeout: 5000,
    })

    return response.status === 200
  }

  isValidYouTubeUrl(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ]

    return patterns.some(pattern => pattern.test(url))
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting YouTube Transcript Service Tests\n')
  
  // Check environment
  if (!process.env.SUPADATA_API_KEY) {
    console.log('⚠️ Warning: SUPADATA_API_KEY not found in environment variables')
    console.log('   Using default API key for testing...\n')
  } else {
    console.log('✅ SUPADATA_API_KEY found in environment\n')
  }

  const tester = new YouTubeTranscriptServiceTest()
  
  // Test URL validation
  console.log('🔍 Testing URL validation...')
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Valid
    'https://youtu.be/dQw4w9WgXcQ', // Valid
    'https://example.com', // Invalid
    'not-a-url', // Invalid
  ]
  
  testUrls.forEach(url => {
    const isValid = tester.isValidYouTubeUrl(url)
    console.log(`   ${isValid ? '✅' : '❌'} ${url}`)
  })
  console.log('')

  // Test transcript fetching
  await tester.testService()
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test failed with error:', error.message)
    process.exit(1)
  })
}

module.exports = { YouTubeTranscriptServiceTest }