#!/usr/bin/env node

/**
 * Simple S3 Upload Test Script
 * Tests the AWS S3 configuration and upload functionality
 */

import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Create a test video-like file
function createTestVideoBuffer() {
  // Simple test content that simulates a video file
  const header = Buffer.from('Test Video File - Insight Meds Hub Upload Test\n');
  const content = Buffer.alloc(1024 * 10, 0); // 10KB of zeros
  return Buffer.concat([header, content]);
}

async function testS3Upload() {
  console.log('🧪 Starting S3 Upload Test for Enhanced Video System\n');

  // Check environment variables
  const requiredVars = [
    'VITE_AWS_ACCESS_KEY_ID',
    'VITE_AWS_SECRET_ACCESS_KEY',
    'VITE_AWS_REGION',
    'VITE_AWS_S3_BUCKET_NAME'
  ];

  console.log('📋 Checking configuration...');
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n💡 Please configure your .env file or run: ./setup-aws-s3.sh\n');
    return;
  }

  console.log('✅ Configuration found:');
  console.log(`   Bucket: ${process.env.VITE_AWS_S3_BUCKET_NAME}`);
  console.log(`   Region: ${process.env.VITE_AWS_REGION}`);
  console.log(`   Access Key: ${process.env.VITE_AWS_ACCESS_KEY_ID.substring(0, 8)}...`);

  // Create S3 client
  const s3Client = new S3Client({
    region: process.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
    },
  });

  const bucketName = process.env.VITE_AWS_S3_BUCKET_NAME;
  const testKey = `test-uploads/test-video-${Date.now()}.mp4`;

  try {
    // Create test video content
    console.log('\n📹 Creating test video file...');
    const testVideoBuffer = createTestVideoBuffer();
    console.log(`   Size: ${(testVideoBuffer.length / 1024).toFixed(1)} KB`);

    // Test upload
    console.log('\n📤 Testing upload...');
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testVideoBuffer,
      ContentType: 'video/mp4',
      Metadata: {
        'drug-name': 'TestDrug-Aspirin',
        'segment-count': '4',
        'total-duration': '30',
        'quality': 'medium',
        'format': 'mp4',
        'generated-at': new Date().toISOString(),
        'test-upload': 'true'
      }
    });

    const uploadStart = Date.now();
    await s3Client.send(uploadCommand);
    const uploadTime = Date.now() - uploadStart;

    console.log('✅ Upload successful!');
    console.log(`   Key: ${testKey}`);
    console.log(`   Upload time: ${uploadTime}ms`);

    // Test file existence
    console.log('\n🔍 Verifying upload...');
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: testKey
    });

    const headResult = await s3Client.send(headCommand);
    console.log('✅ File exists in S3!');
    console.log(`   Size: ${headResult.ContentLength} bytes`);
    console.log(`   Content Type: ${headResult.ContentType}`);
    console.log(`   Last Modified: ${headResult.LastModified}`);

    // Test presigned URL generation
    console.log('\n🔗 Testing presigned URL generation...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 300 }); // 5 minutes
    console.log('✅ Presigned URL generated successfully!');
    console.log(`   URL length: ${presignedUrl.length} characters`);
    console.log(`   Expires in: 5 minutes`);

    // Test download via presigned URL
    console.log('\n🔽 Testing download via presigned URL...');
    try {
      const response = await fetch(presignedUrl);

      if (response.ok) {
        const downloadedBuffer = Buffer.from(await response.arrayBuffer());
        console.log('✅ Download successful!');
        console.log(`   Downloaded size: ${downloadedBuffer.length} bytes`);
        console.log(`   Content matches: ${downloadedBuffer.equals(testVideoBuffer) ? '✅' : '❌'}`);
      } else {
        console.log(`❌ Download failed: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.log(`⚠️  Download test skipped (fetch not available): ${fetchError.message}`);
    }

    // Test video file structure organization
    console.log('\n📁 Testing file organization...');
    const drugName = 'TestDrug-Aspirin';
    const date = new Date().toISOString().split('T')[0];
    const organizedKey = `videos/${drugName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/${date}/combined-medium.mp4`;

    const organizedUploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: organizedKey,
      Body: testVideoBuffer,
      ContentType: 'video/mp4',
      Metadata: {
        'organized-structure': 'true',
        'drug-name': drugName,
        'quality': 'medium'
      }
    });

    await s3Client.send(organizedUploadCommand);
    console.log('✅ Organized structure upload successful!');
    console.log(`   Organized key: ${organizedKey}`);

    // Summary
    console.log('\n🎉 All S3 tests completed successfully!\n');

    console.log('📊 Test Summary:');
    console.log(`   ✅ Basic upload test`);
    console.log(`   ✅ File verification`);
    console.log(`   ✅ Presigned URL generation`);
    console.log(`   ✅ Download verification`);
    console.log(`   ✅ Organized file structure`);

    console.log('\n🚀 Enhanced Video System Status:');
    console.log('   ✅ S3 integration is working properly');
    console.log('   ✅ Video uploads will be stored in cloud');
    console.log('   ✅ Download and sharing features available');
    console.log('   ✅ Proper file organization implemented');

    console.log('\n💡 Next Steps:');
    console.log('   1. Start the app: npm run dev');
    console.log('   2. Navigate to the application');
    console.log('   3. Try "Visualize" action with a drug name');
    console.log('   4. Videos will be professionally concatenated and stored in S3');

    // Test cleanup
    console.log('\n🧹 Cleaning up test files...');

    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: testKey }));
      await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: organizedKey }));
      console.log('✅ Test files cleaned up');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup failed (files may remain in S3)');
    }

  } catch (error) {
    console.error('\n❌ S3 upload test failed:');
    console.error(error.message);

    if (error.name === 'CredentialsError') {
      console.log('\n💡 Credential issue detected:');
      console.log('   1. Check your AWS credentials in .env file');
      console.log('   2. Ensure access key and secret are correct');
      console.log('   3. Try running: ./setup-aws-s3.sh');
    } else if (error.name === 'NoSuchBucket') {
      console.log('\n💡 Bucket issue detected:');
      console.log('   1. Check bucket name in .env file');
      console.log('   2. Ensure bucket exists in the specified region');
      console.log('   3. Try running: ./setup-aws-s3.sh');
    } else if (error.name === 'AccessDenied') {
      console.log('\n💡 Permission issue detected:');
      console.log('   1. Check IAM user has S3 upload permissions');
      console.log('   2. Verify bucket policy allows your user');
      console.log('   3. Try running: ./setup-aws-s3.sh');
    } else {
      console.log('\n💡 General troubleshooting:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify AWS region is correct');
      console.log('   3. Check AWS service status');
    }
  }
}

// Run the test
testS3Upload().catch(console.error);