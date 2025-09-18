# Insight Meds Hub Backend API

A powerful FastAPI backend service for AI-powered medication analysis and market intelligence using Bright Data's competitive intelligence platform and multi-agent workflows.

## Features

🧠 **Multi-Agent Drug Intelligence**
- Researcher Agent: Web scraping with Bright Data
- Analyst Agent: Strategic SWOT analysis
- Writer Agent: Executive report generation

🔬 **Comprehensive Drug Analysis**
- FDA drug information lookup
- PubMed research paper analysis
- Clinical trials tracking (ClinicalTrials.gov)
- Safety warnings and side effects
- Mechanism of action analysis

📊 **Market Intelligence**
- Competitive landscape analysis
- Pricing intelligence across regions
- Market trends and forecasting
- Company profiles and pipeline analysis
- Real-time market monitoring

🚀 **Real-Time Processing**
- Streaming API endpoints for live progress
- Server-Sent Events for real-time updates
- Asynchronous multi-source data collection
- Background processing for large datasets

## Architecture

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   └── endpoints/
│   │       ├── drug_analysis.py    # Drug analysis endpoints
│   │       └── market_research.py  # Market intelligence endpoints
│   ├── core/
│   │   └── config.py           # Application configuration
│   ├── models/
│   │   └── drug.py            # Pydantic data models
│   ├── services/
│   │   ├── multi_agent_intelligence.py  # Multi-agent workflow
│   │   └── ai_models.py       # AI model integrations
│   └── utils/                 # Utility functions
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── startup.py                # Easy startup script
└── README.md                 # This file
```

## Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env file with your API keys
nano .env
```

### 2. API Keys Configuration

Add your API keys to the `.env` file:

```env
# Bright Data - Get from https://brightdata.com/dashboard
BRIGHT_DATA_API_KEY=your_bright_data_key_here

# AI Models (at least one required)
OPENAI_API_KEY=your_openai_key_here          # For GPT-4 analysis
GOOGLE_API_KEY=your_google_gemini_key_here   # For Gemini Pro analysis

# Optional: Database (defaults to SQLite)
DATABASE_URL=sqlite:///./app.db
REDIS_URL=redis://localhost:6379
```

### 3. Start the Server

**Option A: Using the startup script (Recommended)**
```bash
python startup.py
```

**Option B: Manual startup**
```bash
# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Access the API

- **Main API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Drug Analysis

```http
POST /api/v1/drug/analyze
```
Start comprehensive drug analysis with multi-agent intelligence.

**Request Body:**
```json
{
  "drug_name": "aspirin",
  "analysis_type": "overview",
  "include_competitors": true,
  "include_market_data": true,
  "include_clinical_data": true
}
```

**Response:**
```json
{
  "analysis_id": "uuid-string",
  "status": "queued",
  "message": "Drug analysis started for aspirin",
  "estimated_completion_minutes": 5
}
```

### Real-Time Progress Streaming

```http
GET /api/v1/drug/analyze/{analysis_id}/stream
```
Stream real-time analysis progress using Server-Sent Events.

**Response Stream:**
```javascript
data: {"analysis_id": "...", "status": "in_progress", "progress": 25, "current_step": "Collecting FDA data"}
data: {"analysis_id": "...", "status": "in_progress", "progress": 50, "current_step": "Analyzing clinical trials"}
data: {"analysis_id": "...", "status": "completed", "progress": 100, "results": {...}}
```

### Market Intelligence

```http
GET /api/v1/market/intelligence/{drug_name}
```
Get comprehensive market intelligence for a drug.

```http
GET /api/v1/market/competitors/{drug_name}
```
Get detailed competitor analysis.

```http
GET /api/v1/market/pricing/{drug_name}
```
Get pricing analysis across regions.

### Search and Discovery

```http
GET /api/v1/drug/search?query=aspirin&limit=10
```
Search for drugs by name or indication.

```http
POST /api/v1/drug/compare
```
Compare multiple drugs side by side.

## Multi-Agent Intelligence Workflow

The system uses three specialized AI agents:

### 1. Researcher Agent
- **Data Sources**: FDA, PubMed, ClinicalTrials.gov, Market APIs
- **Capabilities**: Web scraping, API integration, data extraction
- **Technology**: Bright Data platform, BeautifulSoup, httpx

### 2. Analyst Agent
- **Functions**: SWOT analysis, market assessment, trend analysis
- **AI Models**: OpenAI GPT-4, Google Gemini Pro
- **Output**: Structured insights, competitive positioning

### 3. Writer Agent
- **Purpose**: Executive summary generation, report writing
- **Features**: Professional pharmaceutical terminology
- **Format**: Structured reports for stakeholders

## Configuration Options

### Analysis Types
- `overview`: General drug information and basic market data
- `market_research`: Comprehensive market intelligence
- `clinical_trials`: Focus on clinical research and trials
- `competitive_analysis`: Deep competitive landscape analysis
- `safety_profile`: Safety warnings and adverse events
- `pricing_analysis`: Detailed pricing and market access

### Market Regions
- `global`: Worldwide market data
- `us`: United States specific
- `eu`: European Union
- `asia`: Asia-Pacific region

## Development

### Adding New Endpoints
1. Create endpoint function in `app/api/endpoints/`
2. Define Pydantic models in `app/models/`
3. Add business logic to `app/services/`
4. Register router in `app/main.py`

### Custom AI Models
Extend `app/services/ai_models.py` to add new AI model integrations:

```python
async def _generate_custom_analysis(self, prompt: str) -> str:
    # Your custom AI model integration
    pass
```

### Testing
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

## Deployment

### Production Deployment
```bash
# Install production dependencies
pip install gunicorn

# Start with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://redis-host:6379
RATE_LIMIT_REQUESTS=1000
```

## Troubleshooting

### Common Issues

**1. Import Errors**
```bash
# Make sure you're in the backend directory
cd backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)/app"
```

**2. Missing Dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**3. API Key Issues**
- Verify API keys are correctly set in `.env`
- Check API key permissions and usage limits
- Ensure `.env` file is in the backend directory

**4. Port Already in Use**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Monitoring and Logs

The API includes built-in logging and health monitoring:
- Health endpoint: `/health`
- Metrics: Built-in request/response timing
- Error tracking: Structured error responses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

This project is part of the Insight Meds Hub healthcare application.

---

For questions or support, please refer to the main project documentation.