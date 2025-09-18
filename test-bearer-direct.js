#!/usr/bin/env node

/**
 * Test using bearer token directly as session token
 */

import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing Bearer Token as Session Token\n');

const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

if (!bearerToken) {
  console.log('❌ No bearer token found');
  process.exit(1);
}

// Try using the bearer token as a session token
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'TEMPORARY',
    secretAccessKey: 'TEMPORARY',
    sessionToken: bearerToken
  }
});

console.log('🔧 Testing with session token approach...');

try {
  // Test list buckets
  console.log('📋 Trying to list buckets...');
  const listResult = await s3Client.send(new ListBucketsCommand({}));
  console.log('✅ Success! Found buckets:');
  listResult.Buckets?.forEach(bucket => {
    console.log(`   - ${bucket.Name}`);
  });
} catch (error) {
  console.log(`❌ List buckets failed: ${error.message}`);
}

// Try with different approach - maybe it's a Bearer token for Authorization header
console.log('\n🔧 Testing with custom authorization...');

try {
  // Create client with custom request handler
  const customClient = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'BEARER_TOKEN_ACCESS',
      secretAccessKey: 'BEARER_TOKEN_SECRET'
    },
    requestHandler: {
      metadata: { handlerProtocol: "http/1.1" },
      requestTimeout: 30000,
      httpsAgent: undefined,
      httpAgent: undefined,
      maxAttempts: 3
    }
  });

  // This won't work directly, but let's see what error we get
  await customClient.send(new ListBucketsCommand({}));

} catch (error) {
  console.log(`❌ Custom auth failed: ${error.message}`);
}

console.log('\n💡 This bearer token may need to be used with:');
console.log('   1. A specific API endpoint or proxy');
console.log('   2. Custom HTTP headers');
console.log('   3. A different AWS service');
console.log('   4. Custom authentication middleware');