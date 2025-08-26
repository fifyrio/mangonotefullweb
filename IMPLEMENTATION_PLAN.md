# MangoNote 项目实现方案

## 项目概述

MangoNote 是一个基于 AI 的智能笔记和学习应用，支持从多种输入源（PDF、音频、YouTube 视频）生成结构化的学习材料，包括思维导图、闪卡和测验。

## 核心功能架构

### 1. 用户旅程设计
```
输入创建 → AI 生成 → 智能复习
   ↓          ↓         ↓
PDF/音频  →  结构化内容  →  间隔重复
YouTube   →  思维导图    →  测验系统
空白笔记  →  闪卡生成    →  进度追踪
```

### 2. 技术栈实现

#### 前端技术栈
- **Next.js 14.0.1** - React 全栈框架，支持 SSR/SSG
- **TypeScript 5.2.2** - 类型安全的 JavaScript
- **Tailwind CSS 3.3.5** - 工具优先的 CSS 框架
- **React 18.2.0** - 前端 UI 库

#### 后端和数据处理
- **PostgreSQL** - 主数据库，存储笔记、内容块、闪卡
- **pdf-parse** - PDF 文本提取
- **AI 服务** - 内容分析和结构化生成

#### 开发和部署工具
- **ESLint** - 代码质量检查
- **PostCSS & Sass** - CSS 处理
- **Vercel Analytics** - 性能监控

## 系统架构设计

### 1. 数据库设计

#### 核心数据表
```sql
-- 用户表
users (id, email, full_name, avatar_url, created_at, is_guest)

-- 笔记表
notes (id, user_id, folder_id, title, source_type, content_status, transcription)

-- 内容块表
content_blocks (id, note_id, type, icon, title, content, sort_order)

-- 闪卡表
flashcards (id, note_id, user_id, question, answer, created_at)

-- 文件夹表
folders (id, user_id, name, color, icon, created_at)
```

#### 数据关系
- **用户** ← 一对多 → **笔记**
- **笔记** ← 一对多 → **内容块**
- **笔记** ← 一对多 → **闪卡**
- **用户** ← 一对多 → **文件夹**

### 2. API 端点设计

#### PDF 处理 API
```typescript
POST /api/pdf/upload
- 输入: FormData (PDF 文件)
- 处理: PDF 解析 → AI 分析 → 数据库存储
- 输出: { success, data: { note, content_blocks, flashcards } }
```

#### 音频处理 API (规划中)
```typescript
POST /api/audio/upload
- 输入: FormData (音频文件)
- 处理: 语音转文字 → AI 分析 → 数据库存储
```

#### YouTube 视频 API (规划中)
```typescript
POST /api/youtube/process
- 输入: { url, language }
- 处理: 字幕提取 → AI 分析 → 数据库存储
```

### 3. 前端组件架构

#### 核心页面组件
```
src/app/
├── page.tsx                    # 着陆页
├── dashboard/page.tsx          # 仪表板
├── notes/[id]/page.tsx         # 笔记详情页
├── auth/signin/page.tsx        # 登录页面
├── auth/signup/page.tsx        # 注册页面
└── processing/page.tsx         # 处理状态页
```

#### 可复用组件
```
src/components/
├── Sidebar.tsx                 # 侧边栏导航
├── modals/
│   ├── RecordAudioModal.tsx    # 录音模态框
│   ├── UploadAudioModal.tsx    # 音频上传模态框
│   ├── UploadPDFModal.tsx      # PDF 上传模态框
│   └── YoutubeVideoModal.tsx   # YouTube 视频模态框
└── ui/                         # 基础 UI 组件
```

### 4. 设计系统

#### 主题配色
- **背景色**: 深灰色主题 (`#121212`, `#1A1A1A`)
- **次级背景**: 较浅灰色 (`#2C2C2C`) 用于卡片和模态框
- **主色调**: 芒果橙色 (`#FFC300`, `#FFA500`) 用于 CTA 和交互元素
- **文本色**: 高对比度白色和灰色

#### 排版设计
- **主要字体**: Inter / Poppins / Nunito Sans
- **层次结构**: H1(3xl) → H2(2xl) → H3(xl) → 正文(base)

## 核心功能实现

### 1. PDF 处理流程

#### 文件上传与验证
```typescript
// 1. 文件验证
- 文件类型: application/pdf
- 文件大小: 最大 10MB
- 内容验证: 确保可提取文本

// 2. 文本提取
const buffer = Buffer.from(await file.arrayBuffer())
const pdfData = await pdfParse(buffer)
const extractedText = pdfData.text
```

#### AI 内容分析
```typescript
// 3. 智能分析
const aiService = new AIService()
const analysisResult = await aiService.analyzeContent(extractedText)

// 生成的内容块类型:
- title: 文档标题
- summary: 内容摘要  
- key_points: 关键要点
- questions: 学习问题
- flashcards: 记忆闪卡
```

#### 数据存储
```typescript
// 4. 结构化存储
- 创建笔记记录
- 保存内容块 (JSON 格式)
- 生成闪卡数据
- 建立关联关系
```

### 2. 用户界面交互

#### 仪表板界面
- **创建区域**: 4 种输入方式的快速入口
- **最近笔记**: 按时间排序的笔记列表
- **使用统计**: 用量仪表和进度指示

#### 笔记详情页
- **标签式导航**: Summary | Mind Map | Flashcards | Quiz
- **侧边栏**: 统一导航和用户信息
- **内容展示**: 结构化的内容块展示

#### 模态框系统
- **拖拽上传**: 文件拖放和点击上传
- **进度反馈**: 上传和处理进度指示
- **错误处理**: 用户友好的错误信息

## 开发实施计划

### 第一阶段: MVP 核心功能 ✅
- [x] 项目初始化和技术栈配置
- [x] 基础 UI 页面和组件开发
- [x] PDF 上传和处理功能
- [x] 数据库集成和 API 开发
- [x] 模态框系统和交互逻辑

### 第二阶段: 功能扩展 (规划中)
- [ ] 音频处理功能实现
- [ ] YouTube 视频处理
- [ ] 用户认证系统
- [ ] 真实 AI 服务集成 (OpenAI/Claude)
- [ ] 思维导图生成

### 第三阶段: 优化和部署 (规划中)
- [ ] 性能优化和缓存策略
- [ ] 响应式设计适配
- [ ] 间隔重复学习算法
- [ ] 云部署和 CDN 配置
- [ ] 监控和分析系统

## 部署和环境配置

### 本地开发环境
```bash
# 1. 安装依赖
npm install

# 2. 环境变量配置
DATABASE_URL=postgresql://username:password@localhost:5432/mangonoteweb

# 3. 启动开发服务器
npm run dev
```

### 生产环境要求
- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **内存**: 至少 2GB RAM
- **存储**: SSD 推荐，支持文件上传存储

### 环境变量清单
```env
# 数据库
DATABASE_URL=postgresql://...

# AI 服务 (未来)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...

# 存储服务 (未来)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# 应用配置
NEXT_PUBLIC_APP_URL=https://...
NEXTAUTH_SECRET=...
```

## 安全和性能考虑

### 数据安全
- **输入验证**: 严格的文件类型和大小限制
- **SQL 注入防护**: 参数化查询
- **敏感信息保护**: 环境变量管理
- **用户隔离**: 基于用户 ID 的数据访问控制

### 性能优化
- **文件处理**: 流式处理大文件
- **数据库**: 连接池和查询优化
- **缓存策略**: API 响应和静态资源缓存
- **CDN 集成**: 静态文件加速

### 监控和日志
- **错误追踪**: 详细的错误日志记录
- **性能监控**: API 响应时间追踪
- **用户行为**: 匿名使用统计
- **系统健康**: 数据库连接和服务状态

## 测试策略

### 单元测试
- API 端点功能测试
- 数据库操作测试
- 文件处理逻辑测试

### 集成测试
- 端到端用户流程测试
- 文件上传到笔记生成流程
- 错误处理和边界情况

### 性能测试
- 大文件处理性能
- 并发用户访问测试
- 数据库查询优化验证

## 未来发展规划

### 功能扩展
1. **多语言支持**: 界面和内容分析的多语言化
2. **协作功能**: 团队笔记共享和协作编辑
3. **移动应用**: React Native 移动端开发
4. **API 开放**: 第三方集成和插件生态

### 技术升级
1. **实时功能**: WebSocket 实时协作
2. **AI 增强**: 更先进的内容理解和生成
3. **搜索优化**: 全文搜索和语义搜索
4. **数据分析**: 学习模式分析和个性化推荐

### 商业模式
1. **免费版本**: 基础功能和限量使用
2. **订阅服务**: 高级 AI 功能和无限制使用
3. **企业版**: 团队协作和定制化部署
4. **API 服务**: 开发者 API 和集成服务

---

本文档为 MangoNote 项目的完整实现方案，涵盖了从技术架构到部署运维的各个方面。项目采用现代化的技术栈，注重用户体验和系统可扩展性，为 AI 驱动的学习应用提供了坚实的基础。