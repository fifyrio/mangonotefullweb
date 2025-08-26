# MangoNote API 接口文档

## 概述

MangoNote API 提供了完整的笔记创建、内容分析和数据管理功能。API 基于 REST 风格设计，使用 JSON 格式进行数据交换。

## 基础信息

- **基础 URL**: `http://localhost:3000/api` (开发环境)
- **内容类型**: `application/json` 或 `multipart/form-data`
- **字符编码**: UTF-8

## 认证 (计划中)

```http
Authorization: Bearer <jwt_token>
```

## API 端点

### 1. PDF 处理

#### 上传 PDF 文件
上传 PDF 文件并生成结构化笔记内容。

**端点**: `POST /api/pdf/upload`

**请求格式**: `multipart/form-data`

**请求参数**:
| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| pdf | File | 是 | PDF 文件，最大 10MB |
| folderId | string | 否 | 目标文件夹 ID |

**请求示例**:
```javascript
const formData = new FormData()
formData.append('pdf', pdfFile)
formData.append('folderId', 'optional-folder-id')

const response = await fetch('/api/pdf/upload', {
  method: 'POST',
  body: formData
})
```

**响应格式**:
```typescript
interface PDFUploadResponse {
  success: boolean
  data?: {
    note: Note
    content_blocks: ContentBlock[]
    analysis: AnalysisItem[]
    flashcards: Flashcard[]
    extracted_text_preview: string
    pdf_metadata: {
      fileName: string
      fileSize: number
      textLength: number
    }
  }
  error?: string
}
```

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "note": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "机器学习基础",
      "source_type": "import",
      "content_status": "completed",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "content_blocks": [
      {
        "id": "content-block-1",
        "note_id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "summary",
        "title": "内容摘要",
        "content": {
          "text": "本文档介绍了机器学习的基本概念...",
          "word_count": 150,
          "estimated_reading_time": 1
        },
        "icon": "📄",
        "icon_color": "#3B82F6",
        "sort_order": 1
      },
      {
        "id": "content-block-2", 
        "note_id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "key_points",
        "title": "关键要点",
        "content": {
          "points": [
            "监督学习和无监督学习的区别",
            "常用的机器学习算法",
            "模型评估和验证方法"
          ]
        },
        "icon": "🔑",
        "icon_color": "#10B981",
        "sort_order": 2
      }
    ],
    "flashcards": [
      {
        "id": "flashcard-1",
        "note_id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "question": "什么是监督学习？",
        "answer": "监督学习是一种机器学习方法，使用已标记的训练数据来学习输入到输出的映射函数。"
      }
    ],
    "extracted_text_preview": "机器学习基础\n\n机器学习是人工智能的一个重要分支...",
    "pdf_metadata": {
      "fileName": "machine_learning_basics.pdf",
      "fileSize": 1048576,
      "textLength": 5000
    }
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "Only PDF files are allowed"
}
```

**状态码**:
- `200` - 处理成功
- `400` - 请求参数错误 (文件类型、大小等)
- `500` - 服务器内部错误

---

### 2. 音频处理 (计划中)

#### 上传音频文件
上传音频文件进行语音转文字和内容分析。

**端点**: `POST /api/audio/upload`

**请求格式**: `multipart/form-data`

**请求参数**:
| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| audio | File | 是 | 音频文件 (mp3, wav, m4a) |
| language | string | 否 | 音频语言 (auto, en, zh, etc.) |
| folderId | string | 否 | 目标文件夹 ID |

**响应格式**:
```typescript
interface AudioUploadResponse {
  success: boolean
  data?: {
    note: Note
    transcription: string
    content_blocks: ContentBlock[]
    flashcards: Flashcard[]
    audio_metadata: {
      fileName: string
      fileSize: number
      duration: number
      language: string
    }
  }
  error?: string
}
```

---

#### 实时录音转录
实时将音频流转换为文本。

**端点**: `POST /api/audio/transcribe`

**请求格式**: `application/octet-stream`

**响应格式**:
```typescript
interface TranscriptionResponse {
  success: boolean
  data?: {
    text: string
    confidence: number
    is_final: boolean
  }
  error?: string
}
```

---

### 3. YouTube 视频处理 (计划中)

#### 处理 YouTube 视频
从 YouTube 视频中提取字幕并生成笔记。

**端点**: `POST /api/youtube/process`

**请求格式**: `application/json`

**请求参数**:
```typescript
interface YouTubeProcessRequest {
  url: string          // YouTube 视频 URL
  language?: string    // 字幕语言偏好
  folderId?: string    // 目标文件夹 ID
}
```

**请求示例**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "language": "zh",
  "folderId": "folder-123"
}
```

**响应格式**:
```typescript
interface YouTubeProcessResponse {
  success: boolean
  data?: {
    note: Note
    video_info: {
      title: string
      duration: number
      thumbnail_url: string
      channel: string
    }
    transcription: string
    content_blocks: ContentBlock[]
    flashcards: Flashcard[]
  }
  error?: string
}
```

---

### 4. 笔记管理 (计划中)

#### 获取用户笔记列表
获取当前用户的所有笔记。

**端点**: `GET /api/notes`

**查询参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |
| folder_id | string | 否 | 文件夹 ID 筛选 |
| search | string | 否 | 搜索关键词 |
| source_type | string | 否 | 来源类型筛选 |
| sort_by | string | 否 | 排序字段 (created_at, updated_at, title) |
| order | string | 否 | 排序方向 (asc, desc) |

**响应格式**:
```typescript
interface NotesListResponse {
  success: boolean
  data?: {
    notes: Note[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      has_next: boolean
      has_prev: boolean
    }
  }
  error?: string
}
```

---

#### 获取单个笔记详情
获取指定笔记的详细信息。

**端点**: `GET /api/notes/:id`

**路径参数**:
- `id` - 笔记 ID (UUID)

**响应格式**:
```typescript
interface NoteDetailResponse {
  success: boolean
  data?: {
    note: Note
    content_blocks: ContentBlock[]
    flashcards: Flashcard[]
  }
  error?: string
}
```

---

#### 更新笔记
更新笔记的基本信息。

**端点**: `PUT /api/notes/:id`

**请求格式**: `application/json`

**请求参数**:
```typescript
interface UpdateNoteRequest {
  title?: string
  folder_id?: string
  markdown?: string
}
```

**响应格式**:
```typescript
interface UpdateNoteResponse {
  success: boolean
  data?: {
    note: Note
  }
  error?: string
}
```

---

#### 删除笔记
删除指定的笔记及其相关内容。

**端点**: `DELETE /api/notes/:id`

**响应格式**:
```typescript
interface DeleteNoteResponse {
  success: boolean
  error?: string
}
```

---

### 5. 内容块管理 (计划中)

#### 获取笔记的内容块
获取指定笔记的所有内容块。

**端点**: `GET /api/notes/:noteId/blocks`

**响应格式**:
```typescript
interface ContentBlocksResponse {
  success: boolean
  data?: {
    content_blocks: ContentBlock[]
  }
  error?: string
}
```

---

#### 更新内容块
更新指定内容块的信息。

**端点**: `PUT /api/notes/:noteId/blocks/:blockId`

**请求参数**:
```typescript
interface UpdateContentBlockRequest {
  title?: string
  content?: any
  sort_order?: number
}
```

---

### 6. 闪卡管理 (计划中)

#### 获取笔记的闪卡
获取指定笔记的所有闪卡。

**端点**: `GET /api/notes/:noteId/flashcards`

**响应格式**:
```typescript
interface FlashcardsResponse {
  success: boolean
  data?: {
    flashcards: Flashcard[]
  }
  error?: string
}
```

---

#### 创建自定义闪卡
为笔记创建自定义闪卡。

**端点**: `POST /api/notes/:noteId/flashcards`

**请求参数**:
```typescript
interface CreateFlashcardRequest {
  question: string
  answer: string
}
```

---

#### 更新闪卡学习进度
更新闪卡的学习状态和进度。

**端点**: `PUT /api/flashcards/:id/progress`

**请求参数**:
```typescript
interface UpdateFlashcardProgressRequest {
  difficulty: number    // 1-5, 难度评级
  last_reviewed: string // ISO 日期字符串
  next_review: string   // 下次复习时间
  review_count: number  // 复习次数
}
```

---

## 数据模型

### Note (笔记)
```typescript
interface Note {
  id: string
  user_id: string
  folder_id?: string
  title: string
  source_type: 'import' | 'record' | 'youtube' | 'manual'
  content_status: 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  url?: string
  transcription?: string
  image_url?: string
  markdown?: string
}
```

### ContentBlock (内容块)
```typescript
interface ContentBlock {
  id: string
  note_id: string
  type: 'summary' | 'key_points' | 'questions' | 'mindmap'
  icon?: string
  icon_color?: string
  title: string
  content: any  // 灵活的 JSON 内容
  sort_order: number
}
```

### Flashcard (闪卡)
```typescript
interface Flashcard {
  id: string
  note_id: string
  user_id: string
  question: string
  answer: string
  created_at: string
  // 学习进度字段 (计划中)
  difficulty?: number
  last_reviewed?: string
  next_review?: string
  review_count?: number
}
```

### AnalysisItem (分析项)
```typescript
interface AnalysisItem {
  type: string
  title: string
  content: any
  icon?: string
  icon_color?: string
  sort_order?: number
}
```

---

## 错误处理

### 标准错误格式
```typescript
interface APIError {
  success: false
  error: string
  code?: string
  details?: any
}
```

### 常见错误码
| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 413 | Payload Too Large | 文件大小超过限制 |
| 415 | Unsupported Media Type | 文件类型不支持 |
| 429 | Too Many Requests | 请求频率超限 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误示例
```json
{
  "success": false,
  "error": "File size must be less than 10MB",
  "code": "FILE_TOO_LARGE",
  "details": {
    "max_size": 10485760,
    "received_size": 15728640
  }
}
```

---

## 速率限制

### 限制规则 (计划中)
- **PDF 上传**: 每分钟最多 10 次
- **音频上传**: 每分钟最多 5 次
- **YouTube 处理**: 每分钟最多 3 次
- **一般 API**: 每分钟最多 100 次

### 响应头
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642694400
```

---

## SDK 和代码示例

### JavaScript/TypeScript 示例

#### PDF 上传
```typescript
async function uploadPDF(file: File, folderId?: string) {
  const formData = new FormData()
  formData.append('pdf', file)
  if (folderId) {
    formData.append('folderId', folderId)
  }

  try {
    const response = await fetch('/api/pdf/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data
  } catch (error) {
    console.error('PDF upload failed:', error)
    throw error
  }
}
```

#### 错误处理
```typescript
try {
  const noteData = await uploadPDF(selectedFile)
  // 处理成功结果
  console.log('Note created:', noteData.note.id)
} catch (error) {
  if (error.message.includes('size')) {
    alert('文件大小不能超过 10MB')
  } else if (error.message.includes('type')) {
    alert('只支持 PDF 文件格式')
  } else {
    alert('上传失败，请稍后重试')
  }
}
```

### React Hook 示例
```typescript
import { useState, useCallback } from 'react'

export function usePDFUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadPDF = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    } catch (error) {
      setError(error instanceof Error ? error.message : '上传失败')
      throw error
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadPDF, isUploading, error }
}
```

---

## 测试

### API 测试示例

#### 使用 curl
```bash
# PDF 上传测试
curl -X POST http://localhost:3000/api/pdf/upload \
  -F "pdf=@/path/to/test.pdf" \
  -v

# 获取笔记列表
curl -X GET "http://localhost:3000/api/notes?page=1&limit=10" \
  -H "Authorization: Bearer <token>" \
  -v
```

#### 使用 Postman
1. 创建新的 Collection "MangoNote API"
2. 设置环境变量 `base_url` = `http://localhost:3000/api`
3. 添加请求示例和测试脚本

---

本文档将随着 API 的发展持续更新，确保为开发者提供准确和完整的接口信息。