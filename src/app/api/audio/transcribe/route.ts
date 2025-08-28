/**
 * Audio Transcription API Route
 * 使用OpenAI Whisper处理音频文件转录
 */

import { NextRequest, NextResponse } from 'next/server';
import { whisperService } from '@/lib/whisper-service';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for audio processing

interface TranscribeRequest {
  language?: string;
  prompt?: string;
  temperature?: number;
  includeTimestamps?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // 检查API密钥
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // 解析form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string;
    const prompt = formData.get('prompt') as string;
    const temperature = formData.get('temperature') as string;
    const includeTimestamps = formData.get('includeTimestamps') === 'true';

    // 验证文件
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Empty audio file' },
        { status: 400 }
      );
    }

    // 准备转录选项
    const transcriptionOptions = {
      language: language || undefined,
      prompt: prompt || undefined,
      temperature: temperature ? parseFloat(temperature) : 0,
      response_format: includeTimestamps ? 'verbose_json' as const : 'json' as const,
    };

    console.log('Starting audio transcription:', {
      filename: audioFile.name,
      size: `${(audioFile.size / 1024 / 1024).toFixed(2)}MB`,
      type: audioFile.type,
      options: transcriptionOptions
    });

    // 执行转录
    const transcriptionResult = await whisperService.transcribeAudio(
      audioFile,
      transcriptionOptions
    );

    // 可选：保存音频文件到Vercel Blob
    let audioUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const timestamp = Date.now();
        const filename = `audio/${timestamp}-${audioFile.name}`;
        
        const blob = await put(filename, audioFile, {
          access: 'public',
        });
        
        audioUrl = blob.url;
        console.log('Audio file saved to blob:', audioUrl);
      } catch (blobError) {
        console.warn('Failed to save audio to blob:', blobError);
        // 继续处理，不中断转录流程
      }
    }

    // 返回转录结果
    return NextResponse.json({
      success: true,
      transcription: transcriptionResult,
      audioUrl,
      metadata: {
        filename: audioFile.name,
        fileSize: audioFile.size,
        mimeType: audioFile.type,
        processedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Audio transcription error:', error);
    
    let errorMessage = 'Audio transcription failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 特定错误处理
      if (error.message.includes('File size') || error.message.includes('Unsupported file format')) {
        statusCode = 400;
      } else if (error.message.includes('API key')) {
        statusCode = 401;
      } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
        statusCode = 429;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}