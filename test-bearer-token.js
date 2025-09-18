#!/usr/bin/env node

/**
 * Debug Bearer Token Authentication
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Bearer Token Debug Test\n');

// Get the bearer token
const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

if (!bearerToken) {
  console.log('❌ No bearer token found in environment');
  process.exit(1);
}

console.log('✅ Bearer token found');
console.log(`   Length: ${bearerToken.length} characters`);

// Decode and analyze
try {
  const decoded = atob(bearerToken);
  console.log(`   Decoded length: ${decoded.length} bytes`);

  // Find colon separator
  const colonIndex = decoded.indexOf(':');
  console.log(`   Colon position: ${colonIndex}`);

  if (colonIndex !== -1) {
    const prefix = decoded.substring(0, colonIndex);
    const credentials = decoded.substring(colonIndex + 1);

    console.log(`   Prefix: "${prefix}"`);
    console.log(`   Credentials length: ${credentials.length}`);
    console.log(`   Credentials (first 20): "${credentials.substring(0, 20)}..."`);

    // Extract account ID
    const accountMatch = prefix.match(/(\d+)/);
    if (accountMatch) {
      console.log(`   Account ID: ${accountMatch[1]}`);
    }

    // Try to decode credentials as base64
    try {
      const credDecoded = atob(credentials);
      console.log(`   Credentials decode successful: ${credDecoded.length} bytes`);
    } catch (e) {
      console.log(`   Credentials not base64 encoded`);
    }
  }

} catch (error) {
  console.log(`❌ Failed to decode bearer token: ${error.message}`);
}

console.log('\n💡 This appears to be a custom authentication format.');
console.log('   We may need to use it differently than standard AWS credentials.');