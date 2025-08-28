/**
 * Real-time Audio Streaming API
 * 实时音频流处理：WebSocket样式的流式转录
 */

import { NextRequest, NextResponse } from 'next/server';
import { whisperService } from '@/lib/whisper-service';
import { notesService } from '@/lib/notes-service';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for streaming

interface StreamChunk {
  id: string;
  timestamp: number;
  audioData: ArrayBuffer;
  isLast: boolean;
}

interface StreamResponse {
  id: string;
  text: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

// Simple in-memory store for active streams
const activeStreams = new Map<string, {
  chunks: Blob[];
  lastActivity: number;
  noteId?: string;
}>();

// Cleanup inactive streams every 5 minutes
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [streamId, stream] of activeStreams.entries()) {
    if (now - stream.lastActivity > timeout) {
      console.log(`Cleaning up inactive stream: ${streamId}`);
      activeStreams.delete(streamId);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, streamId, audioData, isLast, language = 'en', noteId } = body;

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        return handleStreamStart(streamId, noteId);
      
      case 'chunk':
        return handleStreamChunk(streamId, audioData, isLast, language);
      
      case 'end':
        return handleStreamEnd(streamId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, chunk, or end' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Real-time streaming error:', error);
    return NextResponse.json({
      error: 'Streaming failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleStreamStart(streamId: string, noteId?: string): Promise<NextResponse> {
  activeStreams.set(streamId, {
    chunks: [],
    lastActivity: Date.now(),
    noteId
  });

  console.log(`Started real-time stream: ${streamId}`);
  
  return NextResponse.json({
    success: true,
    streamId,
    message: 'Stream started successfully'
  });
}

async function handleStreamChunk(
  streamId: string, 
  audioData: string, 
  isLast: boolean, 
  language: string
): Promise<NextResponse> {
  const stream = activeStreams.get(streamId);
  
  if (!stream) {
    return NextResponse.json(
      { error: 'Stream not found. Call start first.' },
      { status: 404 }
    );
  }

  try {
    // Convert base64 audio data to Blob
    const buffer = Buffer.from(audioData, 'base64');
    const audioBlob = new Blob([buffer], { type: 'audio/webm;codecs=opus' });
    
    // Add chunk to stream
    stream.chunks.push(audioBlob);
    stream.lastActivity = Date.now();

    // Process accumulated chunks if we have enough or if this is the last chunk
    const shouldProcess = stream.chunks.length >= 3 || isLast;
    
    if (shouldProcess && stream.chunks.length > 0) {
      // Combine chunks into single audio file
      const combinedBlob = new Blob(stream.chunks, { type: 'audio/webm;codecs=opus' });
      
      // Skip very small chunks (likely silence)
      if (combinedBlob.size < 1000) {
        stream.chunks = []; // Reset chunks
        return NextResponse.json({
          success: true,
          transcription: null,
          message: 'Chunk too small, skipped'
        });
      }

      // Create file for Whisper
      const audioFile = new File([combinedBlob], `stream-${streamId}-${Date.now()}.webm`, {
        type: combinedBlob.type
      });

      try {
        // Transcribe chunk
        const result = await whisperService.transcribeAudio(audioFile, {
          language: language || undefined,
          response_format: 'verbose_json'
        });

        // Calculate confidence
        const confidence = calculateChunkConfidence(result);
        
        const response: StreamResponse = {
          id: `${streamId}-${Date.now()}`,
          text: result.text.trim(),
          confidence,
          isFinal: isLast,
          timestamp: Date.now()
        };

        // Clear processed chunks
        stream.chunks = [];

        // If this is the last chunk and we have a noteId, save to database
        if (isLast && stream.noteId && response.text.length > 10) {
          try {
            await saveStreamToNote(stream.noteId, response.text);
          } catch (saveError) {
            console.warn('Failed to save stream to note:', saveError);
            // Don't fail the response, just log the error
          }
        }

        return NextResponse.json({
          success: true,
          transcription: response,
          isLast
        });

      } catch (transcriptionError) {
        console.warn('Chunk transcription failed:', transcriptionError);
        
        // Reset chunks and continue
        stream.chunks = [];
        
        return NextResponse.json({
          success: true,
          transcription: null,
          error: 'Transcription failed for this chunk',
          isLast
        });
      }
    }

    return NextResponse.json({
      success: true,
      transcription: null,
      message: 'Chunk received, waiting for more data'
    });

  } catch (error) {
    console.error('Chunk processing error:', error);
    return NextResponse.json({
      error: 'Failed to process audio chunk',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleStreamEnd(streamId: string): Promise<NextResponse> {
  const stream = activeStreams.get(streamId);
  
  if (!stream) {
    return NextResponse.json(
      { error: 'Stream not found' },
      { status: 404 }
    );
  }

  // Process any remaining chunks
  let finalTranscription = null;
  
  if (stream.chunks.length > 0) {
    try {
      const combinedBlob = new Blob(stream.chunks, { type: 'audio/webm;codecs=opus' });
      
      if (combinedBlob.size >= 1000) {
        const audioFile = new File([combinedBlob], `stream-final-${streamId}.webm`, {
          type: combinedBlob.type
        });

        const result = await whisperService.transcribeAudio(audioFile, {
          response_format: 'verbose_json'
        });

        finalTranscription = {
          id: `${streamId}-final`,
          text: result.text.trim(),
          confidence: calculateChunkConfidence(result),
          isFinal: true,
          timestamp: Date.now()
        };

        // Save final transcription to note if noteId exists
        if (stream.noteId && finalTranscription.text.length > 10) {
          try {
            await saveStreamToNote(stream.noteId, finalTranscription.text);
          } catch (saveError) {
            console.warn('Failed to save final stream to note:', saveError);
          }
        }
      }
    } catch (error) {
      console.warn('Final chunk processing failed:', error);
    }
  }

  // Clean up stream
  activeStreams.delete(streamId);
  console.log(`Ended real-time stream: ${streamId}`);

  return NextResponse.json({
    success: true,
    streamId,
    finalTranscription,
    message: 'Stream ended successfully'
  });
}

function calculateChunkConfidence(transcription: any): number {
  if (transcription.segments && transcription.segments.length > 0) {
    const avgLogProb = transcription.segments.reduce((sum: number, seg: any) => 
      sum + (seg.avg_logprob || -1), 0) / transcription.segments.length;
    
    // Convert log probability to confidence (0-1)
    return Math.max(0, Math.min(1, Math.exp(avgLogProb)));
  }
  return 0.5; // Default confidence
}

async function saveStreamToNote(noteId: string, transcription: string): Promise<void> {
  try {
    // Append to existing note transcription
    const note = await notesService.getNoteById(noteId);
    
    if (note) {
      const existingTranscription = note.transcription || '';
      const updatedTranscription = existingTranscription 
        ? `${existingTranscription}\n\n[Real-time Addition - ${new Date().toLocaleString()}]\n${transcription}`
        : transcription;

      // Update note with new transcription
      // This would need to be implemented in NotesService
      console.log(`Would update note ${noteId} with stream transcription:`, transcription.substring(0, 100));
    }
  } catch (error) {
    console.error('Failed to save stream to note:', error);
    throw error;
  }
}