# S3 Integration Setup for CombineOne Video Upload

## Overview

The Insight Meds Hub application has been configured to automatically upload generated videos from CombineOne segmentation to your S3 bucket after video generation is complete.

## Current Configuration

### AWS Credentials
- **Access Key ID**: `AKIAS66UCTNQKN5CZFMP`
- **Secret Access Key**: `V2bgApLd3f4XTzkCsyEnY9nvUlPB8KWZAM3V+YDQ`
- **S3 Bucket**: `mascotly-ai`
- **Region**: `us-east-1`

### Environment Variables
The following environment variables have been configured in `.env`:

```bash
VITE_AWS_ACCESS_KEY_ID=AKIAS66UCTNQKN5CZFMP
VITE_AWS_SECRET_ACCESS_KEY=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
VITE_AWS_REGION=us-east-1
VITE_AWS_S3_BUCKET_NAME=mascotly-ai
VITE_S3_UPLOAD_ENABLED=true
VITE_S3_PRESIGNED_URL_EXPIRATION_MINUTES=60
```

## Integration Flow

### 1. Video Generation Process
When a user selects "Visualize" action:
1. **Drug Analysis**: AI analyzes the medication using AWS Bedrock Claude
2. **Script Generation**: Enhanced prompts are created for video segments
3. **Video Segments**: 4 video segments are generated (30 seconds total)
4. **Video Concatenation**: Segments are combined using CombineOne
5. **S3 Upload**: The final video is automatically uploaded to S3

### 2. S3 Upload Features
- **Automatic Upload**: Videos upload automatically after generation
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Metadata Storage**: Drug name, segments info, and generation details stored
- **Presigned URLs**: Secure download links with configurable expiration
- **Folder Organization**: Videos organized by drug name and date

### 3. File Structure in S3
```
s3://mascotly-ai/
└── videos/
    └── [drug-name]/
        └── [YYYY-MM-DD]/
            ├── combined-medium.mp4      # Main combined video
            ├── segments/                # Individual segments (optional)
            │   ├── segment-1.mp4
            │   ├── segment-2.mp4
            │   ├── segment-3.mp4
            │   └── segment-4.mp4
            └── thumbnail-medium.jpg     # Video thumbnail
```

## Required IAM Permissions

⚠️ **IMPORTANT**: The current IAM user needs the following permissions to work properly:

```json
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
            "Resource": "arn:aws:s3:::mascotly-ai/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::mascotly-ai"
        }
    ]
}
```

### Current Permission Issue
The test revealed that the IAM user `s3_bucket` is missing the `s3:PutObject` permission. To fix this:

1. Go to AWS IAM Console
2. Find the user `s3_bucket`
3. Attach a policy with the permissions above
4. Or modify the existing policy to include S3 write permissions

## Testing S3 Integration

### Manual Test
Run the test script to verify S3 connectivity:
```bash
node simple-s3-test.cjs
```

### Integration Test
1. Start the application: `npm run dev`
2. Enter a medication name (e.g., "Aspirin")
3. Click "Visualize" button
4. Watch for S3 upload progress in the UI
5. Check S3 bucket for uploaded video

## Video Upload Configuration

The video upload can be configured through environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_S3_UPLOAD_ENABLED` | `true` | Enable/disable S3 upload |
| `VITE_VIDEO_QUALITY_DEFAULT` | `medium` | Video quality (high/medium/low) |
| `VITE_VIDEO_FORMAT_DEFAULT` | `mp4` | Video format (mp4/webm) |
| `VITE_S3_PRESIGNED_URL_EXPIRATION_MINUTES` | `60` | URL expiration time |

## Usage in Application

### Automatic Upload
When S3 is enabled, videos automatically upload after generation. Users will see:
- Upload progress indicator
- S3 URLs for sharing and download
- Success/failure notifications

### Manual Upload
For existing videos, you can upload them manually using the enhanced video manager:

```javascript
import { getEnhancedVideoManager } from '@/lib/api/enhanced-video-manager';

const manager = getEnhancedVideoManager();
const uploadResult = await manager.uploadExistingVideo(
  videoBlob,
  segments,
  drugName,
  { onProgress: (progress) => console.log(progress) }
);
```

## Code Integration Points

### Main Integration Files
1. **S3 Service**: `src/lib/api/s3-service.ts` - Core S3 upload functionality
2. **Enhanced Video Manager**: `src/lib/api/enhanced-video-manager.ts` - Orchestrates video generation and upload
3. **Results Display**: `src/components/ResultsDisplay.tsx` - UI integration for upload progress
4. **Environment Config**: `.env` - AWS credentials and configuration

### Key Functions
- `S3VideoService.uploadVideo()` - Upload video with metadata and progress tracking
- `EnhancedVideoManager.generateCompleteVideo()` - Full workflow including S3 upload
- `createS3VideoService()` - Initialize S3 service from environment variables

## Troubleshooting

### Common Issues

1. **Permission Denied**: Add required IAM permissions (see above)
2. **Bucket Not Found**: Verify bucket name and region
3. **Invalid Credentials**: Check access key ID and secret access key
4. **Upload Failed**: Check network connectivity and bucket permissions

### Debug Steps
1. Check browser console for detailed error messages
2. Verify environment variables are loaded correctly
3. Test S3 connectivity with the test script
4. Check AWS CloudTrail for API call details

## Security Considerations

⚠️ **Production Deployment**:
- Never expose AWS credentials in client-side code in production
- Use a backend API to handle S3 uploads securely
- Consider using IAM roles and STS for temporary credentials
- Implement proper CORS policies on the S3 bucket

## Next Steps

1. **Fix IAM Permissions**: Add the required S3 permissions to the IAM user
2. **Test Complete Flow**: Generate a video and verify S3 upload works
3. **Monitor Usage**: Check S3 costs and usage patterns
4. **Optimize Storage**: Consider lifecycle policies for old videos

## Support

For issues with S3 integration:
1. Check this documentation first
2. Run the test scripts for diagnostics
3. Check AWS CloudWatch logs for detailed error information
4. Verify IAM permissions and bucket configuration

---

✅ **Status**: S3 integration is fully implemented and ready for use once IAM permissions are updated.