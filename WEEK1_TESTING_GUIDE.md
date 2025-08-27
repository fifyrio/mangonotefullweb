# Week 1 AI Integration Testing Guide

## 🚀 Quick Start Testing

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Add your OpenRouter API key
echo "OPENROUTER_API_KEY=your_key_here" >> .env.local
```

### 2. Test AI Service (Standalone)
```bash
# Install dependencies if not done
npm install

# Run AI integration test
node scripts/test-ai-integration.js
```

**Expected Output:**
```
🧪 Testing OpenRouter AI Service Integration...

1️⃣ Checking environment variables...
✅ OpenRouter API key found

2️⃣ Testing service initialization...
✅ OpenRouterService initialized successfully

3️⃣ Testing API connectivity...
✅ OpenRouter API is responsive

4️⃣ Testing content analysis...
   Content length: 847 characters
✅ Analysis completed in 3241 ms
   Summary length: 312 characters
   Key points: 6
   Flashcards: 5
   Difficulty: medium

5️⃣ Testing AI Service integration...
✅ AI Service analysis completed
   Generated 4 analysis items
   1. Document Title (title)
   2. AI Summary (summary)
   3. Key Points (key_points)
   4. Study Questions (questions)

6️⃣ Testing flashcard generation...
✅ Flashcards generated: 5
   Q1: What is machine learning?
   A1: Machine learning is a subset of artificial intelligence (AI) that enables computers to learn...

🎉 All tests passed! AI integration is working correctly.
```

### 3. Test Full PDF Upload Flow
```bash
# Start development server
npm run dev

# In browser, go to: http://localhost:3000/en/dashboard
# Upload a PDF file and verify:
# - File uploads successfully
# - AI analysis starts
# - Real summary and flashcards are generated
# - Results appear in note detail page
```

## 🔍 Troubleshooting

### Common Issues:

**❌ "OPENROUTER_API_KEY not found"**
```bash
# Solution: Add API key to .env.local
echo "OPENROUTER_API_KEY=sk-or-v1-your-key-here" >> .env.local
```

**❌ "Rate limit exceeded"**
- Wait 1 minute and try again
- Check OpenRouter dashboard for usage limits

**❌ "Network connection error"**
- Verify internet connection
- Check if OpenRouter.ai is accessible

**❌ "AI service initialization failed"**
- Ensure API key format is correct: `sk-or-v1-...`
- Verify you have credits in your OpenRouter account

**❌ "Failed to parse AI response"**
- AI returned malformed JSON
- Usually resolves with retry
- Check content isn't too complex

## 📊 Success Criteria

### ✅ Week 1 Goals Complete When:
1. **Environment Setup**: OpenRouter API key configured
2. **Basic AI Call**: Can analyze simple text content
3. **Real Data**: AI generates actual summaries (not mock data)
4. **Error Handling**: Graceful fallbacks when AI fails
5. **PDF Integration**: Upload PDF → Extract text → AI analysis → Database storage

### 🎯 Performance Targets:
- AI analysis completes in < 15 seconds for typical documents
- Error rate < 5% for valid content
- Fallback system works when AI is unavailable

## 🐛 Debugging Tips

### Check Development Console:
```bash
npm run dev
# Look for logs like:
# "Starting AI analysis..."
# "OpenRouter analysis attempt 1/3"
# "AI analysis completed successfully"
```

### Verify API Response:
```javascript
// In browser dev tools:
fetch('/api/pdf/upload', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log)
```

### Test Individual Components:
```bash
# Test just the OpenRouter service
node -e "
const { OpenRouterService } = require('./src/lib/openrouter-service.ts');
const service = new OpenRouterService();
service.healthCheck().then(console.log);
"
```

## 📝 Next Steps After Week 1

Once all tests pass:
1. ✅ AI integration is working
2. ✅ Ready for Week 2: UI improvements and flashcard review
3. ✅ Foundation is solid for advanced features

---

*This guide ensures the core AI functionality works before building additional features.*