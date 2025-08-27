/**
 * Test script for AI integration
 * Run with: node scripts/test-ai-integration.js
 */

// Simple test for Node.js environment (without Next.js)
async function testOpenRouterService() {
  console.log('🧪 Testing OpenRouter AI Service Integration...\n')
  
  // Test content
  const testContent = `
Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence (AI) that enables computers to learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.

Key Concepts:
1. Supervised Learning: Uses labeled training data to learn a mapping from inputs to outputs
2. Unsupervised Learning: Finds hidden patterns in data without labeled examples  
3. Reinforcement Learning: Learns through interaction with an environment using rewards and penalties

Applications:
- Image recognition and computer vision
- Natural language processing
- Recommendation systems
- Fraud detection
- Autonomous vehicles

The field continues to evolve rapidly with advances in deep learning, neural networks, and computational power.
`

  try {
    // Test 1: Environment variables
    console.log('1️⃣ Checking environment variables...')
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY not found in environment')
      console.log('   Please add OPENROUTER_API_KEY=your_key to .env.local')
      return false
    }
    console.log('✅ OpenRouter API key found')
    
    // Test 2: Service initialization
    console.log('\n2️⃣ Testing service initialization...')
    const { OpenRouterService } = require('../src/lib/openrouter-service.ts')
    const openRouter = new OpenRouterService()
    console.log('✅ OpenRouterService initialized successfully')
    
    // Test 3: Health check
    console.log('\n3️⃣ Testing API connectivity...')
    const isHealthy = await openRouter.healthCheck()
    if (!isHealthy) {
      console.error('❌ OpenRouter API health check failed')
      return false
    }
    console.log('✅ OpenRouter API is responsive')
    
    // Test 4: Content analysis
    console.log('\n4️⃣ Testing content analysis...')
    console.log('   Content length:', testContent.length, 'characters')
    
    const startTime = Date.now()
    const result = await openRouter.analyzeContent(testContent)
    const endTime = Date.now()
    
    console.log('✅ Analysis completed in', (endTime - startTime), 'ms')
    console.log('   Summary length:', result.summary.length, 'characters')
    console.log('   Key points:', result.key_points.length)
    console.log('   Flashcards:', result.flashcards.length)
    console.log('   Difficulty:', result.difficulty_level)
    
    // Test 5: AI Service integration
    console.log('\n5️⃣ Testing AI Service integration...')
    const { AIService } = require('../src/lib/ai-service.ts')
    const aiService = new AIService()
    
    const analysisItems = await aiService.analyzeContent(testContent)
    console.log('✅ AI Service analysis completed')
    console.log('   Generated', analysisItems.length, 'analysis items')
    
    analysisItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.type})`)
    })
    
    // Test 6: Flashcard generation
    console.log('\n6️⃣ Testing flashcard generation...')
    const flashcards = await aiService.generateFlashcards(testContent)
    console.log('✅ Flashcards generated:', flashcards.length)
    
    flashcards.forEach((card, index) => {
      console.log(`   Q${index + 1}: ${card.question}`)
      console.log(`   A${index + 1}: ${card.answer.substring(0, 100)}...`)
    })
    
    console.log('\n🎉 All tests passed! AI integration is working correctly.')
    return true
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    
    if (error.message.includes('OPENROUTER_API_KEY')) {
      console.log('\n💡 Solution: Add your OpenRouter API key to .env.local:')
      console.log('   OPENROUTER_API_KEY=your_key_here')
    } else if (error.message.includes('rate limit')) {
      console.log('\n💡 Solution: Wait a moment and try again (rate limited)')
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.log('\n💡 Solution: Check your internet connection')
    } else {
      console.log('\n💡 Check the error details above and ensure:')
      console.log('   - OpenRouter API key is valid')
      console.log('   - You have sufficient credits')
      console.log('   - Network connection is stable')
    }
    
    return false
  }
}

// Run test if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' })
  
  testOpenRouterService()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Test runner error:', error)
      process.exit(1)
    })
}

module.exports = { testOpenRouterService }