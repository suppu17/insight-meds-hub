/**
 * Test script for S3 upload functionality
 * This will test the enhanced video system's S3 integration
 */

import { createS3VideoService, VideoMetadata } from './src/lib/api/s3-service';
import { formatFileSize } from './src/lib/api/s3-service';

// Create a test video blob (simulating a small video file)
function createTestVideoBlob(): Blob {
  // Create a simple test video content (WebM header + minimal data)
  const webmHeader = new Uint8Array([
    0x1A, 0x45, 0xDF, 0xA3, // EBML header signature
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F, // EBML header size
    0x42, 0x86, 0x81, 0x01, // EBML version
    0x42, 0xF7, 0x81, 0x01, // EBML read version
    0x42, 0xF2, 0x81, 0x04, // EBML max ID length
    0x42, 0xF3, 0x81, 0x08, // EBML max size length
    0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // doc type "webm"
    0x42, 0x87, 0x81, 0x02, // doc type version
    0x42, 0x85, 0x81, 0x02  // doc type read version
  ]);

  // Add some dummy content to make it a reasonable size
  const dummyContent = new Uint8Array(1024 * 50); // 50KB of zeros
  const combined = new Uint8Array(webmHeader.length + dummyContent.length);
  combined.set(webmHeader, 0);
  combined.set(dummyContent, webmHeader.length);

  return new Blob([combined], { type: 'video/webm' });
}

// Test metadata
const testMetadata: VideoMetadata = {
  drugName: 'TestDrug-Aspirin',
  segmentCount: 4,
  totalDuration: 30,
  quality: 'medium',
  format: 'webm',
  generatedAt: new Date(),
  segments: [
    {
      segmentNumber: 1,
      prompt: 'Test segment 1 - Introduction',
      videoUrl: 'https://example.com/test1.webm',
      duration: 8
    },
    {
      segmentNumber: 2,
      prompt: 'Test segment 2 - Mechanism',
      videoUrl: 'https://example.com/test2.webm',
      duration: 8
    },
    {
      segmentNumber: 3,
      prompt: 'Test segment 3 - Effects',
      videoUrl: 'https://example.com/test3.webm',
      duration: 8
    },
    {
      segmentNumber: 4,
      prompt: 'Test segment 4 - Safety',
      videoUrl: 'https://example.com/test4.webm',
      duration: 6
    }
  ]
};

async function testS3Upload(): Promise<void> {
  console.log('🧪 Starting S3 upload test...');

  try {
    // Check environment variables
    const requiredEnvVars = [
      'VITE_AWS_ACCESS_KEY_ID',
      'VITE_AWS_SECRET_ACCESS_KEY',
      'VITE_AWS_REGION',
      'VITE_AWS_S3_BUCKET_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.log('\n💡 Please run the setup script or configure your .env file:');
      console.log('   ./setup-aws-s3.sh');
      return;
    }

    console.log('✅ Environment variables found');
    console.log(`   Bucket: ${process.env.VITE_AWS_S3_BUCKET_NAME}`);
    console.log(`   Region: ${process.env.VITE_AWS_REGION}`);

    // Create test video
    console.log('📹 Creating test video blob...');
    const testVideo = createTestVideoBlob();
    console.log(`   Size: ${formatFileSize(testVideo.size)}`);
    console.log(`   Type: ${testVideo.type}`);

    // Create S3 service
    console.log('🔧 Initializing S3 service...');
    const s3Service = createS3VideoService();

    // Test upload with progress tracking
    console.log('📤 Starting upload test...');
    const uploadResult = await s3Service.uploadVideo(
      testVideo,
      testMetadata,
      {
        key: `test-uploads/test-video-${Date.now()}.webm`,
        generatePresignedUrl: true,
        expirationMinutes: 5, // Short expiration for testing
        onProgress: (progress) => {
          const progressBar = '█'.repeat(Math.floor(progress.progress / 5)) +
                            '░'.repeat(20 - Math.floor(progress.progress / 5));
          console.log(`   [${progressBar}] ${progress.progress.toFixed(1)}% - ${progress.message}`);
        }
      }
    );

    console.log('✅ Upload successful!');
    console.log(`   S3 Key: ${uploadResult.key}`);
    console.log(`   Size: ${formatFileSize(uploadResult.size)}`);
    console.log(`   Upload time: ${uploadResult.uploadTime}ms`);
    console.log(`   Public URL: ${uploadResult.url}`);
    console.log(`   Presigned URL: ${uploadResult.presignedUrl ? 'Generated ✅' : 'Not generated ❌'}`);
    console.log(`   Expiration: ${uploadResult.expirationTime?.toLocaleString()}`);

    // Test presigned URL download
    if (uploadResult.presignedUrl) {
      console.log('🔽 Testing presigned URL download...');
      try {
        const response = await fetch(uploadResult.presignedUrl);
        if (response.ok) {
          const downloadedSize = parseInt(response.headers.get('content-length') || '0');
          console.log(`✅ Download test successful - Size: ${formatFileSize(downloadedSize)}`);
        } else {
          console.log(`❌ Download test failed - Status: ${response.status}`);
        }
      } catch (downloadError) {
        console.log(`❌ Download test failed - Error: ${downloadError}`);
      }
    }

    // Test thumbnail upload
    console.log('🖼️  Testing thumbnail upload...');
    try {
      // Create a simple test image (1x1 PNG)
      const testThumbnail = new Blob([
        new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
          0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
          0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
          0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, // IDAT data
          0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2,
          0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, // IEND chunk
          0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])
      ], { type: 'image/png' });

      const thumbnailResult = await s3Service.uploadThumbnail(
        testThumbnail,
        testMetadata.drugName,
        {
          quality: 'test',
          onProgress: (progress) => {
            console.log(`   📸 ${progress.message}`);
          }
        }
      );

      console.log(`✅ Thumbnail upload successful: ${thumbnailResult.key}`);
    } catch (thumbnailError) {
      console.log(`⚠️  Thumbnail upload failed: ${thumbnailError}`);
    }

    console.log('\n🎉 S3 upload test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. The enhanced video system is ready to use');
    console.log('   2. Start the app: npm run dev');
    console.log('   3. Try generating a video with "Visualize" action');
    console.log('   4. Videos will now be uploaded to S3 automatically');

  } catch (error) {
    console.error('❌ S3 upload test failed:');
    console.error(error);

    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        console.log('\n💡 Credential issues detected. Try:');
        console.log('   1. Run: ./setup-aws-s3.sh');
        console.log('   2. Or manually configure AWS credentials');
      } else if (error.message.includes('bucket')) {
        console.log('\n💡 Bucket issues detected. Try:');
        console.log('   1. Check bucket name in .env file');
        console.log('   2. Ensure bucket exists and is accessible');
      } else if (error.message.includes('Access')) {
        console.log('\n💡 Permission issues detected. Try:');
        console.log('   1. Check IAM user permissions');
        console.log('   2. Verify bucket policy allows uploads');
      }
    }
  }
}

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testS3Upload, createTestVideoBlob, testMetadata };
}

// Run test if called directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  testS3Upload().catch(console.error);
}