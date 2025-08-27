# MangoNote Product Roadmap 🥭

*Last Updated: 2025-01-27*  
*Status: Phase 0 Complete → Phase 1 Ready*

## 📊 Current Architecture Status

### 🟢 Completed Infrastructure (80%+)
```
Frontend Architecture ✅
├── Next.js 14 + App Router ✅
├── TypeScript + Tailwind CSS ✅  
├── Internationalization (next-intl) ✅
├── UI/UX Design System ✅
└── Responsive Layout Architecture ✅

Data Layer ✅
├── PostgreSQL Schema Design ✅
├── Database Abstraction Layer ✅
└── Vercel Blob File Storage ✅

API Infrastructure ✅
├── PDF Upload Processing ✅
├── Audio Upload Processing ✅
└── RESTful API Architecture ✅
```

### 🟡 Partially Complete (40-60%)
```
User Experience ⚠️
├── Authentication System (UI Complete, Logic Pending) 🔶
├── File Upload Flow ✅
└── Basic Navigation System ✅

AI Integration ⚠️
├── Mock AI Service Architecture ✅
├── Content Analysis Pipeline (Basic) 🔶
└── Real AI Service Integration ❌
```

### 🔴 Core Features Missing (0-20%)
```
Core AI Features ❌
├── Real Content Analysis & Summarization ❌
├── Mind Map Generation ❌
├── Smart Flashcard Generation ❌
├── Adaptive Quiz System ❌
└── Spaced Repetition Algorithm ❌

Advanced Features ❌
├── Real-time Collaboration ❌
├── Speech-to-Text ❌
├── YouTube Video Processing ❌
└── Advanced Search ❌
```

---

## 🏗️ Technical Architecture Strategy

### Recommended Approach: AI-First Microservices Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
├─────────────────────────────────────────┤
│        API Gateway (Next.js API)        │
├─────────────────────────────────────────┤
│            Core Services                │
│  ┌─────────┬─────────┬─────────────────┐ │
│  │AI Service│Content │ User Management │ │
│  │         │Service  │                 │ │
│  └─────────┴─────────┴─────────────────┘ │
├─────────────────────────────────────────┤
│     External AI APIs & Storage          │
│  ┌─────────┬─────────┬─────────────────┐ │
│  │OpenRouter│ Direct  │ Vercel Blob     │ │
│  │ Gateway │ APIs    │ PostgreSQL      │ │
│  └─────────┴─────────┴─────────────────┘ │
└─────────────────────────────────────────┘
```

### Key Design Principles
1. **AI-First**: Every feature designed with AI enhancement in mind
2. **Real-time Processing**: Stream results as they're generated
3. **Scalable Architecture**: Microservices ready for horizontal scaling
4. **User-Centric**: Optimize for learning effectiveness, not just features

---

## 🚀 Implementation Roadmap

## **Phase 1: Core AI Infrastructure (2-3 weeks)**
*Priority: P0 - Critical Path*

### Week 1-2: AI Service Integration
**Goal**: Replace mock AI with real intelligence

**Tasks**:
- [ ] **OpenRouter API Integration** ⭐ *Core Priority*
  - Basic OpenRouter API wrapper
  - Single model integration (Claude 3.5 Sonnet)
  - Simple error handling
- [ ] **Replace Mock AI Service** ⭐ *Core Priority*  
  - Update existing analyzeContent() function
  - Real AI-powered summarization
  - Basic flashcard generation
- [ ] **Simple Progress Tracking** 🔹 *Nice to Have*
  - Loading states in UI
  - Basic progress indicators
  - No real-time updates needed initially

**Simplified Implementation (Week 1-2)**:
```typescript
// Simple OpenRouter Service - Start with basics
class OpenRouterService {
  private readonly BASE_URL = 'https://openrouter.ai/api/v1'
  private readonly MODEL = 'anthropic/claude-3.5-sonnet' // Single model to start
  
  async analyzeContent(text: string): Promise<ContentAnalysis> {
    const response = await fetch(`${this.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'MangoNote'
      },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [{
          role: 'user',
          content: `Analyze this content and provide a summary, key points, and generate 3-5 flashcards:

${text}

Return as JSON with this structure:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "flashcards": [{"question": "...", "answer": "..."}]
}`
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }
}

// Update existing AI service to use OpenRouter
class AIService {
  private openRouter = new OpenRouterService()
  
  async analyzeContent(text: string): Promise<AnalysisItem[]> {
    // Replace mock implementation with real AI
    const analysis = await this.openRouter.analyzeContent(text)
    
    return [
      {
        type: 'summary',
        title: 'AI Summary',
        content: { text: analysis.summary },
        icon: '📄',
        icon_color: '#3B82F6',
        sort_order: 1
      },
      {
        type: 'key_points', 
        title: 'Key Points',
        content: { points: analysis.key_points },
        icon: '🔑',
        icon_color: '#10B981',
        sort_order: 2
      }
    ]
  }
  
  async generateFlashcards(text: string): Promise<Flashcard[]> {
    const analysis = await this.openRouter.analyzeContent(text)
    return analysis.flashcards
  }
}
```

**Why No WebSocket Initially?**
- ⚡ **Simplicity First**: Focus on core AI functionality
- 🎯 **MVP Goal**: Get AI working before optimizing UX
- 📱 **Good Enough UX**: Simple loading spinners work fine for 5-10 second responses
- 🔧 **Less Complexity**: No need for WebSocket infrastructure, connection management, etc.
- 🚀 **Faster Development**: Can ship core features sooner

**When to Add WebSocket Later:**
- ⏱️ If AI responses take >15 seconds consistently  
- 📊 If users need detailed progress (like "Analyzing page 3 of 10")
- 🔄 For long-running batch operations
- 👥 For collaborative features (Phase 3)

**Success Metrics**:
- [ ] Real AI analysis working (replaces mock)
- [ ] PDF → Summary → Flashcards flow complete  
- [ ] Basic error handling for API failures
- [ ] AI response time < 15s for typical documents

### Week 2-3: Core Learning Features MVP
**Goal**: Deliver minimum viable learning experience

**Simplified Tasks**:
- [ ] **Improve AI Quality** ⭐ *Core Priority*
  - Better prompts for consistent output
  - JSON parsing error handling
  - Content validation
- [ ] **Basic Flashcard Review** ⭐ *Core Priority*
  - Simple flashcard flip interface
  - Mark as "Easy/Hard" buttons
  - Store review results
- [ ] **UI Polish** 🔹 *Nice to Have*
  - Better loading states
  - Error messages for users
  - Basic responsive design

**Database Schema Updates**:
```sql
-- AI Processing Results
CREATE TABLE ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash VARCHAR(64) UNIQUE NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Progress Tracking
CREATE TABLE user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  flashcard_id UUID REFERENCES flashcards(id),
  easiness_factor DECIMAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Success Metrics**:
- [ ] PDF upload produces real AI summaries (not mock)
- [ ] Generated flashcards are reviewable and functional  
- [ ] Users can complete full study cycle: Upload → Read → Review

---

## **Phase 2: Advanced Learning Features (3-4 weeks)**
*Priority: P1 - Core Product Differentiation*

### Week 4-5: Mind Map System
**Goal**: Visual learning through AI-generated mind maps

**Tasks**:
- [ ] **Mind Map AI Generation**
  - Hierarchical concept extraction
  - Relationship mapping
  - Visual layout optimization
- [ ] **Interactive Visualization**
  - React Flow or D3.js implementation
  - Zoom, pan, and navigation
  - Node expansion/collapse
- [ ] **Export Functionality**
  - SVG/PNG export
  - PDF integration
  - Shareable links
- [ ] **Collaborative Features**
  - Real-time editing (basic)
  - Comment system
  - Version history

**Technical Choice**: React Flow (recommended)
```typescript
// Mind Map Component Architecture
interface MindMapNode {
  id: string
  type: 'concept' | 'detail' | 'connection'
  data: {
    label: string
    description?: string
    color: string
    importance: number
  }
  position: { x: number; y: number }
}

const MindMapViewer: React.FC<{data: MindMapData}> = ({data}) => {
  return (
    <ReactFlow
      nodes={data.nodes}
      edges={data.edges}
      nodeTypes={customNodeTypes}
      edgeTypes={customEdgeTypes}
    />
  )
}
```

### Week 6-7: Spaced Repetition System
**Goal**: Scientifically-backed learning optimization

**Tasks**:
- [ ] **SM-2 Algorithm Implementation**
  - Optimal review scheduling
  - Performance-based adjustments
  - Forgetting curve modeling
- [ ] **Learning Analytics**
  - Progress visualization
  - Retention rate tracking
  - Personalized insights
- [ ] **Review Queue Management**
  - Daily review scheduling
  - Priority-based ordering
  - Bulk review modes
- [ ] **Gamification Elements**
  - Streak tracking
  - Achievement system
  - Progress milestones

**Spaced Repetition Engine**:
```typescript
class SpacedRepetitionEngine {
  calculateNextReview(
    quality: number,    // User answer quality (0-5)
    easiness: number,   // Easiness factor
    interval: number,   // Current interval
    repetitions: number // Repetition count
  ): ReviewSchedule {
    
    const newEasiness = Math.max(1.3, 
      easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )
    
    let nextInterval: number
    if (quality < 3) {
      nextInterval = 1 // Reset for poor performance
    } else if (repetitions === 0) {
      nextInterval = 1
    } else if (repetitions === 1) {
      nextInterval = 6
    } else {
      nextInterval = Math.round(interval * newEasiness)
    }
    
    return { 
      nextInterval, 
      nextEasiness,
      nextReviewDate: addDays(new Date(), nextInterval)
    }
  }
}
```

**Success Metrics**:
- [ ] Mind maps generate in < 15 seconds
- [ ] Spaced repetition shows measurable learning improvement
- [ ] User engagement with review system > 70%

---

## **Phase 3: Multimedia & Advanced Features (4-5 weeks)**
*Priority: P2 - Market Expansion*

### Week 8-10: Audio & Video Processing
**Goal**: Multi-modal content support

**Tasks**:
- [ ] **Advanced Audio Processing**
  - OpenRouter Whisper integration
  - Multi-language support via OpenRouter
  - Alternative models (Deepgram, AssemblyAI via OpenRouter)
  - Audio quality enhancement
- [ ] **YouTube Integration**
  - Video transcription
  - Chapter segmentation
  - Timestamp synchronization
  - Automatic language detection
- [ ] **Real-time Audio Processing**
  - Live transcription
  - Meeting note capture
  - Voice command support

**Audio Pipeline Architecture**:
```typescript
class AudioProcessor {
  async processAudio(audioFile: File): AsyncGenerator<ProcessingUpdate> {
    yield { stage: 'upload', progress: 0 }
    
    // Upload to secure storage
    const audioUrl = await this.uploadAudio(audioFile)
    yield { stage: 'transcribe', progress: 30 }
    
    // OpenRouter Whisper transcription
    const transcription = await this.transcribeWithOpenRouter(audioUrl)
    yield { stage: 'analyze', progress: 60 }
    
    // AI content analysis
    const analysis = await this.analyzeTranscription(transcription)
    yield { stage: 'complete', progress: 100 }
    
    return { transcription, analysis }
  }
}
```

### Week 11-12: Performance Optimization & Deployment
**Goal**: Production-ready scalability

**Tasks**:
- [ ] **Performance Optimization**
  - React.memo and useMemo optimization
  - Virtual scrolling for large lists
  - Image lazy loading and optimization
  - Bundle splitting and code splitting
- [ ] **Caching Strategy**
  - AI result caching (Redis/Vercel KV)
  - CDN asset optimization
  - Browser caching policies
- [ ] **Monitoring & Analytics**
  - Sentry error tracking
  - Vercel Analytics integration
  - Custom learning analytics
  - A/B testing framework
- [ ] **Security Hardening**
  - API rate limiting
  - Input validation
  - XSS/CSRF protection
  - User data encryption

**Deployment Architecture**:
```typescript
// Edge Function for AI Processing
export const runtime = 'edge'

export async function POST(request: Request) {
  const { content, task } = await request.json()
  
  // Light AI tasks at edge
  if (task === 'simple-analysis') {
    return processAtEdge(content)
  }
  
  // Heavy tasks to main AI service
  return await forwardToAIService(content, task)
}
```

---

## 🎯 Technical Decision Matrix

### AI Service Selection via OpenRouter

| Model (via OpenRouter) | Content Analysis | Cost | Availability | Recommendation |
|-------------------------|------------------|------|--------------|----------------|
| **Claude 3.5 Sonnet** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Primary Analysis** |
| **GPT-4 Turbo** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | **Creative Tasks** |
| **Gemini Pro** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **Fast & Cost-effective** |
| **Whisper (OpenRouter)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **Audio Transcription** |

### OpenRouter Advantages:
- 🔄 **Model Flexibility**: Switch between models based on task requirements
- 💰 **Cost Optimization**: Automatic routing to most cost-effective models
- 🚀 **High Availability**: Multiple provider fallbacks
- 📊 **Usage Analytics**: Built-in cost and performance tracking
- 🔧 **Unified API**: Single integration for multiple AI providers

### State Management Strategy

**Recommended**: Zustand + React Query
```typescript
interface AppState {
  processing: {
    isProcessing: boolean
    currentStage: string | null
    progress: number
    error?: string
  }
  
  content: {
    currentNote: Note | null
    studyMaterials: StudyMaterials | null
  }
  
  learning: {
    reviewQueue: Flashcard[]
    studyStats: LearningStats | null
    currentStreak: number
  }
}
```

### Database Optimization Strategy

**Critical Indexes**:
```sql
-- Performance critical indexes
CREATE INDEX CONCURRENTLY idx_notes_user_created 
ON notes(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_flashcards_review_due 
ON user_learning_progress(user_id, next_review_date)
WHERE next_review_date <= CURRENT_DATE;

-- Full-text search
CREATE INDEX idx_notes_content_search 
ON notes USING gin(to_tsvector('english', title || ' ' || transcription));
```

---

## 📈 Success Metrics & KPIs

### Phase 1 KPIs
- [ ] **Technical**: AI response time < 10s, 95% success rate
- [ ] **Product**: Complete PDF→Study Materials flow
- [ ] **User**: Basic learning loop functional

### Phase 2 KPIs  
- [ ] **Engagement**: 70%+ users engage with spaced repetition
- [ ] **Learning**: Measurable retention improvement
- [ ] **Performance**: Mind maps generate in < 15s

### Phase 3 KPIs
- [ ] **Scale**: Support 1000+ concurrent users
- [ ] **Quality**: < 2s page load times
- [ ] **Reliability**: 99.9% uptime

---

## ⚠️ Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **AI API Costs** | 🟡 Low | 🟠 Medium | OpenRouter intelligent routing + user quotas + real-time cost tracking |
| **Performance Bottlenecks** | 🟠 Medium | 🟠 Medium | Queue system + horizontal scaling + model selection optimization |
| **Data Consistency** | 🟠 Medium | 🟡 Low | Transaction management + optimistic locking |
| **User Experience Delays** | 🟡 Low | 🟠 Medium | Streaming responses + fast model selection + progressive loading |
| **AI Service Outages** | 🟡 Low | 🟡 Low | OpenRouter multi-provider fallback + automatic model switching |
| **Model Quality Inconsistency** | 🟠 Medium | 🟡 Low | Task-specific model selection + quality monitoring + A/B testing |

---

## 💰 Investment & ROI Analysis

### **Development Investment**
- **Phase 1**: 2-3 weeks (Core AI) - **Critical ROI**
- **Phase 2**: 3-4 weeks (Advanced Features) - **High ROI**
- **Phase 3**: 4-5 weeks (Scale & Polish) - **Medium ROI**

### **Expected Returns**

**Short-term (1-3 months)**:
- ✅ Complete MVP product delivery
- ✅ Core user acquisition (1000+ users)
- ✅ Product-market fit validation

**Medium-term (3-6 months)**:
- 📈 User retention rate >80% (AI learning optimization)
- 📈 Premium conversion rate >15% (advanced features)
- 📈 Viral growth coefficient >1.2 (content sharing)

**Long-term Strategic Value**:
- 🚀 AI education market leadership position
- 🚀 Multi-language market expansion capability
- 🚀 B2B education market penetration potential

---

## 🎯 Next Steps & Immediate Actions

### **Week 1 Simplified Priority Tasks**
1. **Set up OpenRouter API integration** ⭐ *Critical*
   - Create basic OpenRouterService class
   - Get Claude 3.5 Sonnet working
   - Test with simple content analysis
2. **Replace Mock AI Service** ⭐ *Critical*
   - Update `src/lib/ai-service.ts` 
   - Replace fake data with real AI responses
   - Ensure PDF upload → AI analysis works
3. **Basic Error Handling** 🔹 *Important*
   - Handle API failures gracefully
   - Show user-friendly error messages
   - Add basic retry logic

### **Development Environment Setup**
```bash
# Environment variables needed
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_APP_NAME=MangoNote
DATABASE_URL=your_postgresql_url
BLOB_READ_WRITE_TOKEN=your_vercel_token
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: Direct API keys for fallback
ANTHROPIC_API_KEY=your_anthropic_key_fallback
OPENAI_API_KEY=your_openai_key_fallback
```

### **OpenRouter Implementation Strategy**

#### **Model Selection Matrix**
```typescript
const TASK_MODEL_MAPPING = {
  // Content Analysis - Use Claude 3.5 Sonnet for best comprehension
  'content-analysis': {
    primary: 'anthropic/claude-3.5-sonnet',
    fallback: 'openai/gpt-4-turbo-preview',
    costThreshold: 10000 // tokens
  },
  
  // Creative Generation - Use GPT-4 for creativity
  'mindmap-generation': {
    primary: 'openai/gpt-4-turbo-preview', 
    fallback: 'anthropic/claude-3.5-sonnet',
    costThreshold: 5000
  },
  
  // Fast Tasks - Use Gemini for speed and cost
  'flashcard-generation': {
    primary: 'google/gemini-pro',
    fallback: 'anthropic/claude-3-haiku',
    costThreshold: 3000
  },
  
  // Audio Processing
  'audio-transcription': {
    primary: 'openai/whisper-1',
    fallback: 'deepgram/nova-2', // if available
    costThreshold: Infinity
  }
}
```

#### **Cost Optimization Logic**
```typescript
class CostOptimizer {
  calculateOptimalModel(task: string, contentLength: number, userTier: string) {
    const mapping = TASK_MODEL_MAPPING[task]
    
    // Free tier users get cost-effective models
    if (userTier === 'free' && contentLength > 2000) {
      return 'google/gemini-pro'
    }
    
    // Premium users get best models
    if (userTier === 'premium') {
      return mapping.primary
    }
    
    // Smart fallback based on content size
    return contentLength > mapping.costThreshold 
      ? mapping.fallback 
      : mapping.primary
  }
  
  async trackUsage(userId: string, modelUsed: string, tokensUsed: number) {
    // Real-time cost tracking and user quotas
    await this.updateUserUsage(userId, {
      model: modelUsed,
      tokens: tokensUsed,
      cost: this.calculateCost(modelUsed, tokensUsed),
      timestamp: new Date()
    })
  }
}
```

### **OpenRouter Integration Benefits**
- 🎯 **Optimal Model Selection**: Automatically choose the best model for each task
- 💰 **Cost Efficiency**: Up to 70% cost savings through intelligent routing
- 🔒 **Reliability**: Built-in fallbacks and rate limit handling
- 📈 **Scalability**: No need to manage multiple API integrations
- 🔍 **Analytics**: Real-time cost and performance monitoring
- 🚀 **A/B Testing**: Easy model comparison for performance optimization

### **Ready for Development**
The architecture analysis shows **MangoNote is 70% complete** with solid foundations. The core gap is AI service implementation and learning algorithms. 

**Recommendation**: Begin Phase 1 immediately. The codebase is well-structured, technical debt is minimal, and the development path is clear.

---

*This roadmap serves as a living document and will be updated as development progresses and user feedback is incorporated.*

**Document Status**: ✅ Architecture Complete → 🚀 Ready for Phase 1 Implementation