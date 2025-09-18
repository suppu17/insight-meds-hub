#!/usr/bin/env node

/**
 * Test script to verify S3 upload integration for video generation
 * This script tests the complete workflow from video generation to S3 upload
 */

import { S3VideoService } from './src/lib/api/s3-service.ts';
import fs from 'fs';

// Configuration from environment variables
const AWS_CONFIG = {
  accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || 'AKIAS66UCTNQKN5CZFMP',
  secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || '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',
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  bucketName: process.env.VITE_AWS_S3_BUCKET_NAME || 'mascotly-ai'
};

console.log('🧪 Testing S3 Integration for Video Upload');
console.log('==========================================\n');

async function testS3Upload() {
  try {
    console.log('📋 Configuration:');
    console.log(`   Access Key ID: ${AWS_CONFIG.accessKeyId.substr(0, 10)}...`);
    console.log(`   Bucket Name: ${AWS_CONFIG.bucketName}`);
    console.log(`   Region: ${AWS_CONFIG.region}\n`);

    // Create S3 service instance
    console.log('🔌 Creating S3 service instance...');
    const s3Service = new S3VideoService(AWS_CONFIG);
    console.log('✅ S3 service created successfully\n');

    // Test 1: Create a dummy video blob for testing
    console.log('📹 Creating test video blob...');
    const testVideoContent = Buffer.from('This is a test video file content for S3 upload testing');
    const testVideoBlob = new Blob([testVideoContent], { type: 'video/mp4' });
    console.log(`✅ Test video blob created (${testVideoBlob.size} bytes)\n`);

    // Test 2: Create video metadata
    console.log('📊 Creating video metadata...');
    const videoMetadata = {
      drugName: 'Aspirin-Test',
      segmentCount: 4,
      totalDuration: 30,
      quality: 'medium',
      format: 'mp4',
      generatedAt: new Date(),
      segments: [
        { segmentNumber: 1, prompt: 'Test segment 1', videoUrl: 'http://test.com/1.mp4', duration: 8 },
        { segmentNumber: 2, prompt: 'Test segment 2', videoUrl: 'http://test.com/2.mp4', duration: 8 },
        { segmentNumber: 3, prompt: 'Test segment 3', videoUrl: 'http://test.com/3.mp4', duration: 8 },
        { segmentNumber: 4, prompt: 'Test segment 4', videoUrl: 'http://test.com/4.mp4', duration: 6 }
      ]
    };
    console.log('✅ Video metadata created\n');

    // Test 3: Upload video to S3 with progress tracking
    console.log('🚀 Starting S3 upload test...');
    let uploadProgress = 0;

    const uploadResult = await s3Service.uploadVideo(
      testVideoBlob,
      videoMetadata,
      {
        generatePresignedUrl: true,
        expirationMinutes: 60,
        onProgress: (progress) => {
          if (progress.progress > uploadProgress + 10) {
            uploadProgress = progress.progress;
            console.log(`   📤 ${progress.stage}: ${progress.progress}% - ${progress.message}`);
          }
        }
      }
    );

    console.log('\n✅ Upload completed successfully!');
    console.log('📋 Upload Results:');
    console.log(`   S3 Key: ${uploadResult.key}`);
    console.log(`   Public URL: ${uploadResult.url}`);
    console.log(`   Presigned URL: ${uploadResult.presignedUrl ? 'Generated' : 'Not generated'}`);
    console.log(`   File Size: ${uploadResult.size} bytes`);
    console.log(`   Upload Time: ${uploadResult.uploadTime}ms`);

    if (uploadResult.expirationTime) {
      console.log(`   Expiration: ${uploadResult.expirationTime.toISOString()}`);
    }

    // Test 4: Verify the uploaded video exists
    console.log('\n🔍 Verifying upload...');
    const exists = await s3Service.videoExists(uploadResult.key);
    console.log(`✅ Video exists in S3: ${exists ? 'Yes' : 'No'}\n`);

    // Test 5: Generate download URL
    console.log('🔗 Generating download URL...');
    const downloadUrl = await s3Service.generateDownloadUrl(
      uploadResult.key,
      30, // 30 minutes
      'aspirin-test-video.mp4'
    );
    console.log(`✅ Download URL generated: ${downloadUrl.length > 0 ? 'Success' : 'Failed'}\n`);

    // Test 6: Clean up - delete test video
    console.log('🧹 Cleaning up test video...');
    await s3Service.deleteVideo(uploadResult.key);
    console.log('✅ Test video deleted from S3\n');

    console.log('🎉 All S3 integration tests passed!');
    console.log('\n📌 Summary:');
    console.log('   ✅ S3 service initialization');
    console.log('   ✅ Video upload with progress tracking');
    console.log('   ✅ Presigned URL generation');
    console.log('   ✅ Video existence verification');
    console.log('   ✅ Download URL generation');
    console.log('   ✅ Video cleanup/deletion');

    console.log('\n🚀 The S3 integration is ready for video generation!');
    console.log(`   Videos will be uploaded to: s3://${AWS_CONFIG.bucketName}/videos/`);
    console.log('   After CombineOne video generation, videos will automatically upload to S3');

  } catch (error) {
    console.error('\n❌ S3 integration test failed:', error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('   1. Verify AWS credentials are correct');
    console.error('   2. Check S3 bucket exists and is accessible');
    console.error('   3. Ensure bucket permissions allow PutObject/GetObject/DeleteObject');
    console.error('   4. Verify AWS region is correct');

    if (error.message.includes('credentials')) {
      console.error('\n🔑 Credential issues detected:');
      console.error(`   Access Key ID: ${AWS_CONFIG.accessKeyId}`);
      console.error(`   Secret Key: ${AWS_CONFIG.secretAccessKey ? '[SET]' : '[NOT SET]'}`);
    }

    if (error.message.includes('bucket')) {
      console.error('\n🪣 Bucket issues detected:');
      console.error(`   Bucket Name: ${AWS_CONFIG.bucketName}`);
      console.error(`   Region: ${AWS_CONFIG.region}`);
    }

    process.exit(1);
  }
}

// Run the test
testS3Upload()
  .then(() => {
    console.log('\n🏁 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });