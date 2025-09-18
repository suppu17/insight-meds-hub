# Deep Research Integration Guide

## 🔬 Overview

The **Deep Research** feature connects your frontend directly to the backend API's multi-agent intelligence system, leveraging Claude Sonnet, NOVA Premier, and Bright Data for comprehensive pharmaceutical analysis.

## 🎯 User Flow

### 1. **User Entry**
- User enters medication name (e.g., "aspirin", "metformin", "lisinopril")
- Clicks **"Deep Research"** button from the enhanced action menu

### 2. **Backend Integration**
- Frontend calls `POST /api/v1/drug/analyze` with:
  ```json
  {
    "drug_name": "aspirin",
    "analysis_type": "market_research",
    "include_competitors": true,
    "include_market_data": true,
    "include_clinical_data": true
  }
  ```

### 3. **Multi-Agent Processing**
- **Researcher Agent** (NOVA Premier): Collects data from FDA, PubMed, ClinicalTrials.gov
- **Analyst Agent** (Claude Sonnet): Performs SWOT analysis and market intelligence
- **Writer Agent** (Claude Sonnet): Generates executive summaries
- **Bright Data**: Provides competitive intelligence and market data

### 4. **Real-time Updates**
- Server-Sent Events stream progress updates:
  ```
  "Collecting drug data from multiple sources" (10%)
  "Analyzing market intelligence data" (40%)
  "Generating comprehensive report" (70%)
  "Analysis complete" (100%)
  ```

### 5. **Rich Results Display**
- **Executive Intelligence Report**: AI-generated strategic summary
- **Multi-Agent Findings**: Market trends, regulatory insights
- **Competitive Intelligence**: AI-analyzed competitor data
- **Real-time Market Intelligence**: Live market status

## 🎨 UI Features

### Enhanced Action Buttons
```tsx
// New buttons added to ActionButtons component
{
  id: 'deep_research',
  title: 'Deep Research',
  description: 'AI-powered market intelligence',
  icon: Microscope,
  gradient: 'bg-gradient-accent'
}
```

### Specialized Loading States
- **Multi-Agent Intelligence Pipeline** progress indicator
- **AI Models**: Claude, NOVA badges
- **Data Sources**: Bright Data + FDA + PubMed indicators
- **Real-time progress** with specific deep research messaging

### Results Display
- **AI-Powered Header**: Shows Claude Sonnet, NOVA Premier, Bright Data
- **Executive Intelligence Report**: Professional pharmaceutical analysis
- **Multi-Agent Findings**: Structured market and regulatory insights
- **Competitive Intelligence**: AI-analyzed competitor profiles
- **Enhanced Data Sources**: AI model and intelligence source badges

## 🔧 Technical Implementation

### Frontend API Integration
```typescript
// Automatic backend connection
const analysisResponse = await drugAnalysisAPI.startDrugAnalysis({
  drug_name: drugName,
  analysis_type: 'market_research', // Maps to multi-agent workflow
  include_competitors: true,
  include_market_data: true,
  include_clinical_data: true
});

// Real-time streaming
const stream = drugAnalysisAPI.createAnalysisStream(analysisResponse.analysis_id);
stream.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  // Updates UI with real-time progress
};
```

### Backend Multi-Agent Workflow
```python
# Three-agent system
researcher = ResearcherAgent()  # NOVA Premier + Bright Data
analyst = AnalystAgent()        # Claude Sonnet
writer = WriterAgent()          # Claude Sonnet

# Coordinated intelligence workflow
async def run_drug_intelligence_workflow(drug_name):
    # 1. Research Phase - Data Collection
    research_data = await researcher.scrape_drug_data(drug_name)

    # 2. Analysis Phase - Strategic Insights
    analysis_results = await analyst.analyze_market_intelligence(research_data, drug_name)

    # 3. Report Phase - Executive Summary
    executive_summary = await writer.generate_executive_summary(analysis_results, drug_name)

    return comprehensive_results
```

## 💡 Key Benefits

### For Users
- **Comprehensive Intelligence**: Multi-source data with AI enhancement
- **Real-time Updates**: Live progress tracking during analysis
- **Professional Reports**: Executive-level pharmaceutical insights
- **Competitive Analysis**: AI-powered competitor intelligence

### For Developers
- **Seamless Integration**: No frontend changes required for basic functionality
- **Scalable Architecture**: Multi-agent system handles complex analysis
- **Cost Optimization**: Intelligent model selection (NOVA Micro → Premier → Claude)
- **Real-time Streaming**: Server-Sent Events for live updates

## 🚀 Testing the Integration

### 1. Start Backend
```bash
cd backend
source venv/bin/activate  # If using virtual environment
python startup.py
# API available at http://localhost:8000
```

### 2. Start Frontend
```bash
npm run dev
# Frontend available at http://localhost:8080
```

### 3. Test Deep Research
1. Navigate to http://localhost:8080
2. Enter medication: **"aspirin"** or **"metformin"**
3. Click **"Deep Research"** button
4. Watch real-time progress updates
5. Review comprehensive AI-generated results

### 4. Expected Results
- **Loading**: Multi-agent intelligence pipeline with Claude/NOVA badges
- **Progress**: Real-time updates from data collection → analysis → reporting
- **Results**: Executive report, market trends, competitor analysis, data sources
- **Performance**: ~2-5 minutes for comprehensive analysis

## 🎯 Action Mapping

| **Frontend Action** | **Backend Analysis Type** | **AI Models Used** |
|-------------------|--------------------------|-------------------|
| `deep_research` | `market_research` | Claude Sonnet + NOVA Premier |
| `research` | `clinical_trials` | NOVA Premier |
| `competitive` | `competitive_analysis` | Claude Sonnet |
| `overview` | `overview` | NOVA Micro/Premier |

## 🔍 Monitoring & Debugging

### Frontend Console
```javascript
// Check API calls
console.log('Analysis started:', analysisResponse);
console.log('Progress update:', progressData);
console.log('Results received:', analysisResults);
```

### Backend Logs
```python
# Multi-agent workflow logging
print(f"Researcher Agent: Collecting data for {drug_name}")
print(f"Analyst Agent: Using Claude Sonnet for analysis")
print(f"Writer Agent: Generating executive summary")
```

### API Testing
```bash
# Test backend directly
curl -X POST "http://localhost:8000/api/v1/drug/analyze" \
  -H "Content-Type: application/json" \
  -d '{"drug_name": "aspirin", "analysis_type": "market_research"}'

# Monitor real-time stream
curl -N "http://localhost:8000/api/v1/drug/analyze/{analysis_id}/stream"
```

The Deep Research feature now provides users with AI-powered pharmaceutical intelligence that combines the best of Claude Sonnet's analytical capabilities, NOVA Premier's efficient processing, and Bright Data's competitive intelligence platform.