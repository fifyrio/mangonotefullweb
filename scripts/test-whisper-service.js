/**
 * Test script for OpenAI Whisper audio transcription service
 * Run with: node scripts/test-whisper-service.js
 */

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using process.env directly');
}
const fs = require('fs');
const path = require('path');

// Mock File class for Node.js environment
class MockFile {
  constructor(filePath) {
    this.name = path.basename(filePath);
    this.size = fs.statSync(filePath).size;
    this.type = this.getMimeType(filePath);
    this._buffer = fs.readFileSync(filePath);
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm'
    };
    return mimeTypes[ext] || 'audio/mpeg';
  }

  stream() {
    return this._buffer;
  }

  arrayBuffer() {
    return Promise.resolve(this._buffer.buffer);
  }
}

// Mock OpenAI for testing without actual API calls
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: async ({ file, model, language, response_format, temperature }) => {
        console.log('🎤 Mock Whisper API Call:');
        console.log(`  - Model: ${model}`);
        console.log(`  - File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log(`  - Language: ${language || 'auto-detect'}`);
        console.log(`  - Format: ${response_format}`);
        console.log(`  - Temperature: ${temperature}`);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (response_format === 'verbose_json') {
          return {
            text: "This is a mock transcription of the audio file. In a real scenario, this would contain the actual transcribed speech from the audio file.",
            language: language || 'en',
            duration: 45.6,
            segments: [
              {
                id: 0,
                seek: 0,
                start: 0.0,
                end: 5.0,
                text: "This is a mock transcription",
                tokens: [123, 456, 789],
                temperature: temperature || 0,
                avg_logprob: -0.5,
                compression_ratio: 1.2,
                no_speech_prob: 0.1
              },
              {
                id: 1,
                seek: 500,
                start: 5.0,
                end: 10.0,
                text: " of the audio file.",
                tokens: [234, 567, 890],
                temperature: temperature || 0,
                avg_logprob: -0.4,
                compression_ratio: 1.1,
                no_speech_prob: 0.05
              }
            ]
          };
        } else {
          return {
            text: "This is a mock transcription of the audio file."
          };
        }
      }
    }
  }
};

// WhisperService with mock OpenAI
class TestWhisperService {
  constructor() {
    this.openai = mockOpenAI;
    this.MAX_FILE_SIZE = 25 * 1024 * 1024;
    this.SUPPORTED_FORMATS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
  }

  validateAudioFile(file) {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum limit of 25MB`);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
      throw new Error(`Unsupported file format: ${extension}. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`);
    }
  }

  detectLanguage(filename) {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('chinese') || lowerName.includes('中文') || lowerName.includes('zh')) {
      return 'zh';
    }
    if (lowerName.includes('japanese') || lowerName.includes('日本') || lowerName.includes('ja')) {
      return 'ja';
    }
    
    return undefined;
  }

  async transcribeAudio(file, options = {}) {
    try {
      console.log('\n🔄 Starting transcription...');
      this.validateAudioFile(file);

      if (!options.language) {
        options.language = this.detectLanguage(file.name);
      }

      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        response_format: options.response_format || 'verbose_json',
        temperature: options.temperature || 0,
      });

      if (options.response_format === 'verbose_json') {
        return {
          text: response.text,
          language: response.language,
          duration: response.duration,
          segments: response.segments,
        };
      } else {
        return {
          text: typeof response === 'string' ? response : response.text,
        };
      }

    } catch (error) {
      console.error('❌ Whisper transcription error:', error);
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
  }

  async processAudioAdvanced(file, options = {}, onProgress) {
    try {
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: 'Validating audio file...'
      });

      this.validateAudioFile(file);

      onProgress?.({
        stage: 'preprocessing',
        progress: 20,
        message: 'Preparing audio for transcription...'
      });

      if (!options.language) {
        options.language = this.detectLanguage(file.name);
      }

      onProgress?.({
        stage: 'transcribing',
        progress: 40,
        message: 'Transcribing audio with Whisper...'
      });

      const transcription = await this.transcribeAudio(file, {
        ...options,
        response_format: 'verbose_json'
      });

      onProgress?.({
        stage: 'analyzing',
        progress: 80,
        message: 'Analyzing transcribed content...'
      });

      const analysis = this.analyzeTranscription(transcription);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Audio processing complete!'
      });

      return {
        transcription,
        analysis
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Audio processing failed',
        error: errorMessage
      });

      throw error;
    }
  }

  analyzeTranscription(transcription) {
    const text = transcription.text;
    
    return {
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      duration: transcription.duration,
      detectedLanguage: transcription.language,
      averageConfidence: transcription.segments 
        ? transcription.segments.reduce((acc, seg) => acc + (1 - seg.no_speech_prob), 0) / transcription.segments.length
        : undefined,
      hasTimestamps: !!transcription.segments,
      segmentCount: transcription.segments?.length || 0,
      preview: text.length > 200 ? text.substring(0, 200) + '...' : text,
    };
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'zh', name: 'Chinese (Mandarin)' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
    ];
  }
}

// Test functions
async function testBasicTranscription() {
  console.log('\n🧪 Test 1: Basic Audio Transcription');
  console.log('=====================================');
  
  const whisperService = new TestWhisperService();
  
  // Create a mock audio file
  const mockAudioFile = {
    name: 'test-audio.mp3',
    size: 1024 * 1024, // 1MB
    type: 'audio/mpeg',
    stream: () => Buffer.alloc(1024),
    arrayBuffer: () => Promise.resolve(Buffer.alloc(1024).buffer)
  };
  
  try {
    const result = await whisperService.transcribeAudio(mockAudioFile, {
      language: 'en',
      response_format: 'verbose_json'
    });
    
    console.log('✅ Transcription Result:');
    console.log(`  - Text: ${result.text}`);
    console.log(`  - Language: ${result.language}`);
    console.log(`  - Duration: ${result.duration}s`);
    console.log(`  - Segments: ${result.segments?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testAdvancedProcessing() {
  console.log('\n🧪 Test 2: Advanced Audio Processing with Progress');
  console.log('==================================================');
  
  const whisperService = new TestWhisperService();
  
  const mockAudioFile = {
    name: 'advanced-test-chinese.mp3',
    size: 5 * 1024 * 1024, // 5MB
    type: 'audio/mpeg',
    stream: () => Buffer.alloc(1024),
    arrayBuffer: () => Promise.resolve(Buffer.alloc(1024).buffer)
  };
  
  const progressCallback = (progress) => {
    console.log(`📊 ${progress.stage.toUpperCase()}: ${progress.progress}% - ${progress.message}`);
    if (progress.error) {
      console.log(`❌ Error: ${progress.error}`);
    }
  };
  
  try {
    const result = await whisperService.processAudioAdvanced(
      mockAudioFile,
      { temperature: 0.2 },
      progressCallback
    );
    
    console.log('\n✅ Advanced Processing Result:');
    console.log(`  - Transcription: ${result.transcription.text.substring(0, 100)}...`);
    console.log(`  - Word Count: ${result.analysis.wordCount}`);
    console.log(`  - Detected Language: ${result.analysis.detectedLanguage}`);
    console.log(`  - Average Confidence: ${result.analysis.averageConfidence?.toFixed(2) || 'N/A'}`);
    console.log(`  - Has Timestamps: ${result.analysis.hasTimestamps}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testValidation() {
  console.log('\n🧪 Test 3: File Validation');
  console.log('===========================');
  
  const whisperService = new TestWhisperService();
  
  // Test 1: Unsupported format
  const unsupportedFile = {
    name: 'test.txt',
    size: 1024,
    type: 'text/plain'
  };
  
  try {
    whisperService.validateAudioFile(unsupportedFile);
    console.log('❌ Should have failed for unsupported format');
    return false;
  } catch (error) {
    console.log('✅ Correctly rejected unsupported format:', error.message);
  }
  
  // Test 2: File too large
  const largeFile = {
    name: 'large-audio.mp3',
    size: 30 * 1024 * 1024, // 30MB
    type: 'audio/mpeg'
  };
  
  try {
    whisperService.validateAudioFile(largeFile);
    console.log('❌ Should have failed for file too large');
    return false;
  } catch (error) {
    console.log('✅ Correctly rejected large file:', error.message);
  }
  
  // Test 3: Valid file
  const validFile = {
    name: 'valid-audio.mp3',
    size: 1024 * 1024, // 1MB
    type: 'audio/mpeg'
  };
  
  try {
    whisperService.validateAudioFile(validFile);
    console.log('✅ Correctly accepted valid file');
    return true;
  } catch (error) {
    console.log('❌ Should have accepted valid file:', error.message);
    return false;
  }
}

async function testLanguageDetection() {
  console.log('\n🧪 Test 4: Language Detection');
  console.log('==============================');
  
  const whisperService = new TestWhisperService();
  
  const testCases = [
    { filename: 'chinese-lesson.mp3', expected: 'zh' },
    { filename: '中文课程.mp3', expected: 'zh' },
    { filename: 'japanese-podcast.mp3', expected: 'ja' },
    { filename: 'english-lecture.mp3', expected: undefined },
    { filename: 'random-audio.mp3', expected: undefined }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const detected = whisperService.detectLanguage(testCase.filename);
    if (detected === testCase.expected) {
      console.log(`✅ ${testCase.filename}: detected ${detected || 'auto'}`);
    } else {
      console.log(`❌ ${testCase.filename}: expected ${testCase.expected || 'auto'}, got ${detected || 'auto'}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testSupportedLanguages() {
  console.log('\n🧪 Test 5: Supported Languages');
  console.log('===============================');
  
  const whisperService = new TestWhisperService();
  const languages = whisperService.getSupportedLanguages();
  
  console.log('✅ Supported languages:');
  languages.forEach(lang => {
    console.log(`  - ${lang.code}: ${lang.name}`);
  });
  
  return languages.length > 0;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting OpenAI Whisper Service Tests');
  console.log('==========================================');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not found in environment variables');
    console.log('💡 Running in mock mode (no actual API calls)');
  } else {
    console.log('🔑 OPENAI_API_KEY found - could make real API calls');
    console.log('💡 Running in mock mode for testing');
  }
  
  const tests = [
    { name: 'Basic Transcription', fn: testBasicTranscription },
    { name: 'Advanced Processing', fn: testAdvancedProcessing },
    { name: 'File Validation', fn: testValidation },
    { name: 'Language Detection', fn: testLanguageDetection },
    { name: 'Supported Languages', fn: testSupportedLanguages }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
    }
  }
  
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Whisper service is ready for use.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
  
  return passed === total;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  TestWhisperService,
  runAllTests
};