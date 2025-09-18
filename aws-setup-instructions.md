# AWS S3 Setup Instructions for Video Storage

## Prerequisites
- AWS Account with S3 and IAM permissions
- AWS CLI configured with appropriate credentials

## Step 1: Create S3 Bucket

```bash
# Set variables
BUCKET_NAME="insight-meds-hub-videos-$(date +%s)"
REGION="us-east-1"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

echo "Bucket created: $BUCKET_NAME"
```

## Step 2: Configure Bucket CORS Policy

Create a CORS configuration file:

```json
cat > cors-config.json << 'EOF'
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
```

Apply CORS configuration:
```bash
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors-config.json
```

## Step 3: Configure Bucket Policy (Optional - for public read access)

If you want videos to be publicly accessible (not recommended for sensitive content):

```json
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
```

Apply bucket policy:
```bash
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
```

## Step 4: Create IAM User for Video Upload

Create IAM user:
```bash
aws iam create-user --user-name insight-meds-video-uploader
```

Create IAM policy for S3 access:
```json
cat > s3-upload-policy.json << EOF
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
```

Create and attach policy:
```bash
aws iam create-policy --policy-name InsightMedsS3UploadPolicy --policy-document file://s3-upload-policy.json

# Get the policy ARN (replace ACCOUNT-ID with your AWS account ID)
POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/InsightMedsS3UploadPolicy"

aws iam attach-user-policy --user-name insight-meds-video-uploader --policy-arn $POLICY_ARN
```

## Step 5: Create Access Keys

```bash
aws iam create-access-key --user-name insight-meds-video-uploader
```

This will output something like:
```json
{
    "AccessKey": {
        "UserName": "insight-meds-video-uploader",
        "AccessKeyId": "AKIA...",
        "Status": "Active",
        "SecretAccessKey": "...",
        "CreateDate": "..."
    }
}
```

## Step 6: Update Environment Variables

Update your `.env` file with the values:

```bash
# AWS Configuration
VITE_AWS_ACCESS_KEY_ID=your_access_key_from_step_5
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_from_step_5
VITE_AWS_REGION=us-east-1
VITE_AWS_S3_BUCKET_NAME=your_bucket_name_from_step_1

# Video Processing Settings
VITE_VIDEO_QUALITY_DEFAULT=medium
VITE_VIDEO_FORMAT_DEFAULT=mp4
VITE_S3_UPLOAD_ENABLED=true
VITE_S3_PRESIGNED_URL_EXPIRATION_MINUTES=60
```

## Step 7: Test the Configuration

You can test the S3 upload functionality using the AWS CLI:

```bash
# Test upload
echo "Test video file" > test-video.mp4
aws s3 cp test-video.mp4 s3://$BUCKET_NAME/test/test-video.mp4

# Test download
aws s3 cp s3://$BUCKET_NAME/test/test-video.mp4 downloaded-test.mp4

# Clean up test files
aws s3 rm s3://$BUCKET_NAME/test/test-video.mp4
rm test-video.mp4 downloaded-test.mp4
```

## Alternative: Using Existing Bucket

If you already have an S3 bucket, you can use it by:

1. Adding CORS configuration (Step 2)
2. Creating IAM user with appropriate permissions (Steps 4-5)
3. Updating environment variables with your existing bucket name

## Security Notes

- **Never commit AWS credentials to version control**
- Use IAM roles instead of access keys in production
- Regularly rotate access keys
- Monitor S3 costs and usage
- Consider implementing lifecycle policies to automatically delete old videos

## Troubleshooting

### CORS Errors
- Verify CORS configuration is applied correctly
- Check that your domain is in the AllowedOrigins list

### Upload Failures
- Verify IAM user has correct permissions
- Check bucket policy doesn't conflict with IAM permissions
- Ensure region matches between bucket and configuration

### Access Denied
- Verify access keys are correct and active
- Check IAM policy has all required actions
- Ensure bucket name is correct in environment variables