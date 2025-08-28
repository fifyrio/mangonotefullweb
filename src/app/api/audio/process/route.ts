/**
 * Advanced Audio Processing API Route
 * 高级音频处理：转录 + AI内容分析 + 学习材料生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { whisperService } from '@/lib/whisper-service';
import { openRouterService } from '@/lib/openrouter-service';
import { notesService } from '@/lib/notes-service';
import { flashcardService } from '@/lib/flashcard-service';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for complex processing

interface ProcessAudioRequest {
  userId: string;
  folderId?: string;
  title: string;
  language?: string;
  generateLearningMaterials?: boolean;
}

interface ProcessingProgress {
  stage: 'uploading' | 'preprocessing' | 'transcribing' | 'analyzing' | 'generating_materials' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('userId') as string;
    const folderId = formData.get('folderId') as string;
    const title = formData.get('title') as string;
    const language = formData.get('language') as string;
    const generateLearningMaterials = formData.get('generateLearningMaterials') === 'true';

    // 验证必需参数
    if (!audioFile || !userId || !title) {
      return NextResponse.json(
        { error: 'Missing required parameters: audio, userId, title' },
        { status: 400 }
      );
    }

    console.log('Starting advanced audio processing:', {
      filename: audioFile.name,
      size: `${(audioFile.size / 1024 / 1024).toFixed(2)}MB`,
      userId,
      title,
      language,
      generateLearningMaterials
    });

    // 创建处理进度跟踪
    const progressCallback = (progress: ProcessingProgress) => {
      console.log('Processing progress:', progress);
      // TODO: 实现WebSocket或SSE实时进度推送
    };

    let audioUrl: string | null = null;
    
    // 阶段1：上传音频文件
    progressCallback({
      stage: 'uploading',
      progress: 10,
      message: 'Uploading and validating audio file...'
    });

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const timestamp = Date.now();
      const filename = `audio/${userId}/${timestamp}-${audioFile.name}`;
      
      const blob = await put(filename, audioFile, {
        access: 'public',
      });
      
      audioUrl = blob.url;
    }

    // 阶段2：音频转录
    progressCallback({
      stage: 'transcribing',
      progress: 30,
      message: 'Transcribing audio with Whisper...'
    });

    const transcriptionResult = await whisperService.processAudioAdvanced(
      audioFile,
      { 
        language: language || undefined,
        response_format: 'verbose_json'
      },
      progressCallback
    );

    // 阶段3：AI内容分析
    progressCallback({
      stage: 'analyzing',
      progress: 60,
      message: 'Analyzing content with AI...'
    });

    // 阶段3：AI内容分析
    const aiAnalysisResult = await openRouterService.analyzeContent(
      transcriptionResult.transcription.text
    );

    // 创建笔记记录
    const note = await notesService.createNote({
      title,
      userId,
      folderId: folderId || null,
      sourceType: 'audio',
      transcription: transcriptionResult.transcription.text,
      audioUrl,
      contentStatus: 'completed'
    });

    // 保存AI分析结果作为内容块
    const contentBlocks = [];
    
    // Create summary block
    const summaryBlock = await notesService.createContentBlock({
      noteId: note.id,
      type: 'summary',
      title: 'AI Summary',
      content: { text: aiAnalysisResult },
      icon: '📄',
      iconColor: '#3B82F6',
      sortOrder: 1
    });
    contentBlocks.push(summaryBlock);

    let flashcards = [];
    
    // 阶段4：生成学习材料（可选）
    if (generateLearningMaterials) {
      progressCallback({
        stage: 'generating_materials',
        progress: 80,
        message: 'Generating flashcards and study materials...'
      });

      try {
        // 简化的闪卡生成（基于转录内容）
        const sentences = transcriptionResult.transcription.text
          .split(/[.!?]+/)
          .filter(s => s.trim().length > 20)
          .slice(0, 5); // 最多5张卡片

        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i].trim();
          if (sentence) {
            const card = await flashcardService.createFlashcard({
              noteId: note.id,
              userId,
              question: `What was mentioned about: ${sentence.substring(0, 50)}...?`,
              answer: sentence
            });
            
            // 初始化间隔重复跟踪
            await flashcardService.initializeSpacedRepetition(card.id, userId);
            flashcards.push(card);
          }
        }
      } catch (flashcardError) {
        console.warn('Flashcard generation failed:', flashcardError);
        // 继续处理，不中断主流程
      }
    }

    // 完成处理
    progressCallback({
      stage: 'complete',
      progress: 100,
      message: 'Audio processing completed successfully!'
    });

    // 返回完整处理结果
    return NextResponse.json({
      success: true,
      data: {
        note: {
          id: note.id,
          title: note.title,
          transcription: transcriptionResult.transcription.text,
          audioUrl,
          contentBlocks: contentBlocks.length,
          flashcards: flashcards.length
        },
        transcription: {
          text: transcriptionResult.transcription.text,
          language: transcriptionResult.transcription.language,
          duration: transcriptionResult.transcription.duration,
          segments: transcriptionResult.transcription.segments?.length || 0,
          confidence: transcriptionResult.analysis.averageConfidence
        },
        aiAnalysis: {
          contentBlocks: contentBlocks.length,
          wordCount: transcriptionResult.analysis.wordCount,
          preview: transcriptionResult.analysis.preview
        },
        learningMaterials: generateLearningMaterials ? {
          flashcardsGenerated: flashcards.length,
          flashcards: flashcards.map(card => ({
            id: card.id,
            question: card.question,
            answer: card.answer
          }))
        } : null,
        metadata: {
          processedAt: new Date().toISOString(),
          audioFile: {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type
          }
        }
      }
    });

  } catch (error) {
    console.error('Advanced audio processing error:', error);
    
    let errorMessage = 'Audio processing failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('File size') || error.message.includes('format')) {
        statusCode = 400;
      } else if (error.message.includes('API key')) {
        statusCode = 401;
      } else if (error.message.includes('quota')) {
        statusCode = 429;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      stage: 'error',
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}