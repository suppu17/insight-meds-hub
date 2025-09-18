#!/bin/bash

# AWS S3 Setup Script for Insight Meds Hub Video Storage
# Run this script with AWS credentials that have S3 and IAM permissions

set -e  # Exit on any error

echo "🚀 Setting up AWS S3 for Insight Meds Hub Video Storage..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "📋 Checking AWS credentials..."
aws sts get-caller-identity > /dev/null || {
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
}

# Set variables
BUCKET_NAME="insight-meds-hub-videos-$(date +%s)"
REGION="us-east-1"
IAM_USER="insight-meds-video-uploader"
POLICY_NAME="InsightMedsS3UploadPolicy"

echo "📦 Creating S3 bucket: $BUCKET_NAME"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Create CORS configuration
echo "🔧 Configuring CORS policy..."
cat > /tmp/cors-config.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
            "AllowedOrigins": [
                "http://localhost:8080",
                "http://localhost:8081",
                "https://yourdomain.com"
            ],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file:///tmp/cors-config.json

# Create IAM user (skip if already exists)
echo "👤 Creating IAM user: $IAM_USER"
if aws iam get-user --user-name $IAM_USER &> /dev/null; then
    echo "ℹ️  IAM user $IAM_USER already exists, skipping creation"
else
    aws iam create-user --user-name $IAM_USER
fi

# Create IAM policy
echo "🔑 Creating IAM policy: $POLICY_NAME"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

cat > /tmp/s3-upload-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            ],
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::$BUCKET_NAME"
        }
    ]
}
EOF

# Create policy (delete existing if it exists)
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

if aws iam get-policy --policy-arn $POLICY_ARN &> /dev/null; then
    echo "ℹ️  Policy $POLICY_NAME already exists, deleting and recreating..."
    # Detach from user first
    aws iam detach-user-policy --user-name $IAM_USER --policy-arn $POLICY_ARN 2>/dev/null || true
    # Delete existing policy versions
    for version in $(aws iam list-policy-versions --policy-arn $POLICY_ARN --query 'Versions[?!IsDefaultVersion].VersionId' --output text 2>/dev/null || true); do
        aws iam delete-policy-version --policy-arn $POLICY_ARN --version-id $version 2>/dev/null || true
    done
    aws iam delete-policy --policy-arn $POLICY_ARN 2>/dev/null || true
fi

aws iam create-policy --policy-name $POLICY_NAME --policy-document file:///tmp/s3-upload-policy.json

# Attach policy to user
echo "📎 Attaching policy to user..."
aws iam attach-user-policy --user-name $IAM_USER --policy-arn $POLICY_ARN

# Create access keys (delete existing ones first)
echo "🔐 Creating access keys..."
# Delete existing access keys
for access_key in $(aws iam list-access-keys --user-name $IAM_USER --query 'AccessKeyMetadata[].AccessKeyId' --output text 2>/dev/null || true); do
    echo "🗑️  Deleting existing access key: $access_key"
    aws iam delete-access-key --user-name $IAM_USER --access-key-id $access_key
done

# Create new access key
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name $IAM_USER)
ACCESS_KEY_ID=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.SecretAccessKey')

# Update .env file
echo "📝 Updating .env file..."
if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "💾 Backed up existing .env to .env.backup"
fi

cat > .env << EOF
# AWS Bedrock Configuration for Claude AI
VITE_AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID
VITE_AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
VITE_AWS_REGION=$REGION

# AWS S3 Configuration for Video Storage
VITE_AWS_S3_BUCKET_NAME=$BUCKET_NAME

# fal.ai API Key for Video and Image Generation
# Get this from: https://fal.ai/dashboard
VITE_FAL_API_KEY=your_fal_api_key_here

# Video Processing Configuration
VITE_VIDEO_QUALITY_DEFAULT=medium
VITE_VIDEO_FORMAT_DEFAULT=mp4
VITE_S3_UPLOAD_ENABLED=true
VITE_S3_PRESIGNED_URL_EXPIRATION_MINUTES=60

# Note: In production, never expose these keys in the frontend
# Use a backend proxy server to make API calls securely
EOF

# Test the setup
echo "🧪 Testing S3 configuration..."
echo "Test video file content" > /tmp/test-video.mp4

if aws s3 cp /tmp/test-video.mp4 s3://$BUCKET_NAME/test/test-video.mp4; then
    echo "✅ Upload test successful"

    if aws s3 cp s3://$BUCKET_NAME/test/test-video.mp4 /tmp/downloaded-test.mp4; then
        echo "✅ Download test successful"
        aws s3 rm s3://$BUCKET_NAME/test/test-video.mp4
        echo "🧹 Cleaned up test files"
    else
        echo "❌ Download test failed"
    fi
else
    echo "❌ Upload test failed"
fi

# Cleanup temp files
rm -f /tmp/cors-config.json /tmp/s3-upload-policy.json /tmp/test-video.mp4 /tmp/downloaded-test.mp4

echo ""
echo "🎉 AWS S3 setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $REGION"
echo "  IAM User: $IAM_USER"
echo "  Access Key ID: $ACCESS_KEY_ID"
echo "  Secret Access Key: [HIDDEN - check .env file]"
echo ""
echo "⚠️  Security Reminders:"
echo "  - Never commit the .env file to version control"
echo "  - Regularly rotate access keys"
echo "  - Monitor S3 costs and usage"
echo "  - Consider implementing lifecycle policies for old videos"
echo ""
echo "🚀 You can now test video generation with S3 upload enabled!"
echo "   Start the development server: npm run dev"
echo "   Navigate to the app and try generating a video"
EOF