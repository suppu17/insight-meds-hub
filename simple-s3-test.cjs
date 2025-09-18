// Simple S3 upload test using AWS SDK directly
const { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// AWS Configuration (using your provided credentials)
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAS66UCTNQKN5CZFMP',
    secretAccessKey: 'V2bgApLd3f4XTzkCsyEnY9nvUlPB8KWZAM3V+YDQ'
  }
});

const BUCKET_NAME = 'mascotly-ai';

async function testS3Connection() {
  console.log('🧪 Testing S3 Connection for Video Upload');
  console.log('======================================\n');

  try {
    // Test 1: Create a simple test file
    console.log('📄 Creating test video file...');
    const testContent = 'This is a test video file from CombineOne video generation';
    const testKey = `videos/test/test-video-${Date.now()}.mp4`;

    // Test 2: Upload the file
    console.log('📤 Uploading to S3...');
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'video/mp4',
      Metadata: {
        'drug-name': 'Test-Aspirin',
        'generated-by': 'CombineOne',
        'upload-test': 'true'
      }
    });

    await s3Client.send(uploadCommand);
    console.log('✅ Upload successful!');
    console.log(`   S3 URL: s3://${BUCKET_NAME}/${testKey}`);
    console.log(`   Public URL: https://${BUCKET_NAME}.s3.amazonaws.com/${testKey}\n`);

    // Test 3: Verify file exists
    console.log('🔍 Verifying upload...');
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey
    });

    const headResponse = await s3Client.send(headCommand);
    console.log('✅ File verified in S3');
    console.log(`   Content Length: ${headResponse.ContentLength} bytes`);
    console.log(`   Content Type: ${headResponse.ContentType}`);
    console.log(`   Last Modified: ${headResponse.LastModified}\n`);

    // Test 4: Clean up
    console.log('🧹 Cleaning up test file...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey
    });

    await s3Client.send(deleteCommand);
    console.log('✅ Test file deleted\n');

    // Success summary
    console.log('🎉 S3 Integration Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ AWS credentials are valid');
    console.log(`   ✅ Bucket "${BUCKET_NAME}" is accessible`);
    console.log('   ✅ Can upload files');
    console.log('   ✅ Can verify file existence');
    console.log('   ✅ Can delete files');

    console.log('\n🚀 Ready for CombineOne Video Upload!');
    console.log('   After video generation, files will automatically upload to:');
    console.log(`   s3://${BUCKET_NAME}/videos/[drug-name]/[date]/`);

  } catch (error) {
    console.error('\n❌ S3 Integration Test FAILED');
    console.error('Error:', error.message);

    // Provide specific troubleshooting guidance
    if (error.Code === 'NoSuchBucket') {
      console.error('\n🪣 Bucket Error:');
      console.error(`   The bucket "${BUCKET_NAME}" does not exist or is not accessible`);
      console.error('   Please verify the bucket name and region');
    } else if (error.Code === 'InvalidAccessKeyId') {
      console.error('\n🔑 Credentials Error:');
      console.error('   The AWS Access Key ID is invalid');
      console.error('   Please check your AWS credentials');
    } else if (error.Code === 'SignatureDoesNotMatch') {
      console.error('\n🔐 Secret Key Error:');
      console.error('   The AWS Secret Access Key is invalid');
      console.error('   Please check your AWS credentials');
    } else if (error.Code === 'AccessDenied') {
      console.error('\n🚫 Permission Error:');
      console.error('   Access denied to S3 bucket');
      console.error('   Please check IAM permissions for the bucket');
    }

    process.exit(1);
  }
}

// Run the test
testS3Connection();