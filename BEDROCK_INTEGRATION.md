# Amazon Bedrock Integration Guide

## Overview

The Insight Meds Hub backend now uses **Amazon Bedrock** with Claude Sonnet and NOVA models for AI-powered drug analysis, replacing OpenAI/Google integrations. This provides better pharmaceutical analysis capabilities and consistent model access.

## 🔧 Configuration

### Environment Variables

Add these to your backend `.env` file:

```bash
# AWS Bedrock Configuration (match your frontend credentials)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1

# Bedrock Model IDs (pre-configured)
BEDROCK_CLAUDE_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_NOVA_PREMIER_MODEL_ID=us.amazon.nova-premier-v1:0
BEDROCK_NOVA_MICRO_MODEL_ID=us.amazon.nova-micro-v1:0
```

### Model Usage Strategy

| **Model** | **Use Case** | **Complexity** | **Cost** |
|-----------|-------------|----------------|----------|
| **Claude Sonnet** | Complex analysis, SWOT, executive reports | High | Higher |
| **NOVA Premier** | Balanced analysis, data processing | Medium | Balanced |
| **NOVA Micro** | Quick responses, basic data extraction | Low | Lowest |

## 🤖 Multi-Agent Architecture

### 1. Researcher Agent
- **Model**: NOVA Premier (data processing)
- **Function**: Web scraping, data collection, AI-enhanced processing
- **Sources**: FDA, PubMed, ClinicalTrials.gov, Bright Data

### 2. Analyst Agent
- **Model**: Claude Sonnet (complex analysis)
- **Function**: SWOT analysis, market intelligence, strategic insights
- **Output**: Structured pharmaceutical analysis with actionable insights

### 3. Writer Agent
- **Model**: Claude Sonnet (sophisticated writing)
- **Function**: Executive summaries, professional reports
- **Format**: Executive-level language for pharmaceutical stakeholders

## 📊 API Integration

### Backend Service Usage

```python
from app.services.ai_models import AIModelService

ai_service = AIModelService()

# Use Claude Sonnet for complex analysis
analysis = await ai_service.generate_analysis(
    prompt,
    model_preference="claude",
    complexity="high"
)

# Use NOVA Premier for balanced tasks
data_processing = await ai_service.generate_analysis(
    prompt,
    model_preference="nova_premier",
    complexity="medium"
)

# Use NOVA Micro for quick responses
quick_response = await ai_service.generate_analysis(
    prompt,
    model_preference="nova_micro",
    complexity="low"
)
```

### Real-time Drug Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/drug/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "drug_name": "aspirin",
    "analysis_type": "competitive_analysis",
    "include_competitors": true,
    "include_market_data": true,
    "include_clinical_data": true
  }'
```

### Streaming Progress

```javascript
const eventSource = new EventSource('/api/v1/drug/analyze/{analysis_id}/stream');

eventSource.onmessage = function(event) {
  const progress = JSON.parse(event.data);
  console.log(`${progress.current_step}: ${progress.progress_percentage}%`);
};
```

## 🚀 Setup & Testing

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Test Integration

```bash
# Test backend structure and Bedrock connection
python test_api.py

# Should show:
# ✅ Amazon Bedrock client initialized
# ✅ Claude Sonnet model ID: anthropic.claude-3-sonnet-20240229-v1:0
# ✅ NOVA Premier model ID: us.amazon.nova-premier-v1:0
```

### 3. Start Server

```bash
# Development mode
python startup.py

# Or using npm script
npm run backend:dev
```

## 🔄 Migration from OpenAI/Google

The backend automatically falls back gracefully:

1. **Primary**: Amazon Bedrock (Claude + NOVA models)
2. **Fallback**: Structured placeholder responses
3. **Legacy**: OpenAI/Google (deprecated)

No code changes needed in the frontend - the API endpoints remain the same.

## 💡 Benefits

### Performance
- **Faster responses** with NOVA Micro for basic queries
- **Sophisticated analysis** with Claude Sonnet for complex tasks
- **Balanced performance** with NOVA Premier for most operations

### Cost Optimization
- **Automatic model selection** based on complexity
- **NOVA Micro** for high-volume, low-complexity tasks
- **Claude Sonnet** reserved for high-value analysis

### Integration
- **Consistent with frontend** using same AWS credentials
- **Same API endpoints** - no frontend changes required
- **Real-time streaming** preserved with Bedrock models

## 🛠️ Troubleshooting

### Common Issues

1. **Bedrock client not initialized**
   - Check AWS credentials in `.env`
   - Verify AWS region is set to `us-east-1`
   - Ensure Bedrock service is enabled in AWS console

2. **Model access denied**
   - Request access to Claude and NOVA models in AWS Bedrock console
   - Check IAM permissions for Bedrock service

3. **Import errors**
   - Install missing dependencies: `pip install boto3 pydantic`
   - Use virtual environment: `python -m venv venv && source venv/bin/activate`

### Testing Commands

```bash
# Test basic imports and configuration
cd backend && python test_api.py

# Test with virtual environment
python -m venv venv
source venv/bin/activate
pip install boto3 pydantic pydantic-settings fastapi httpx beautifulsoup4
python test_api.py
```

## 📈 Monitoring

The system provides built-in logging for:
- Model selection decisions
- API call success/failure rates
- Response times for different models
- Fallback usage statistics

Check logs for model performance and optimize usage patterns accordingly.