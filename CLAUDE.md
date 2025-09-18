# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Insight Meds Hub is a comprehensive healthcare web application that provides:

1. **AI-Powered Medication Analysis** - Upload prescription photos or enter drug names for detailed medication insights
2. **Health Concern & Symptom Analyzer** - Enter health concerns and symptoms (with voice input support) to receive evidence-based natural remedies and guidance
3. **Comprehensive Medical Information** - Safety analysis, drug interactions, and personalized healthcare recommendations

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router DOM
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Cloud Services**: AWS SDK (Bedrock, S3), FAL AI client
- **Voice Integration**: Gladia API for speech-to-text transcription

### Backend
- **Framework**: FastAPI with Python
- **AI Services**: Multi-agent workflow with OpenAI GPT-4, Google Gemini Pro
- **Data Intelligence**: Bright Data platform integration
- **Real-time**: Server-Sent Events for streaming responses
- **Data Sources**: FDA, PubMed, ClinicalTrials.gov APIs

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Backend Development
```bash
# Setup backend environment and dependencies
npm run backend:setup

# Start backend server (FastAPI on port 8000)
npm run backend:start

# Start backend in development mode with auto-reload
npm run backend:dev

# Test backend API endpoints
npm run backend:test
```

### Full-Stack Development
```bash
# Install both frontend and backend dependencies
npm run setup

# Run both frontend and backend concurrently
npm run fullstack
```

## Project Structure

```
├── src/                  # Frontend React application
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components (auto-generated)
│   │   ├── UploadZone.tsx   # File upload and manual entry component
│   │   ├── ActionButtons.tsx # Main action buttons for analysis
│   │   ├── ResultsDisplay.tsx # Results and insights display
│   │   ├── MedInsightLogo.tsx # App logo component
│   │   └── AdditionalFeatures.tsx # Additional feature tiles
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main application page
│   │   └── NotFound.tsx     # 404 page
│   ├── lib/                 # Utilities
│   │   └── utils.ts         # Shared utility functions
│   ├── hooks/               # Custom React hooks
│   ├── assets/              # Static assets
│   └── main.tsx            # Application entry point
├── backend/              # FastAPI backend service
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── api/endpoints/       # API route handlers
│   │   ├── core/config.py       # Application configuration
│   │   ├── models/              # Pydantic data models
│   │   ├── services/            # Business logic and AI services
│   │   └── utils/               # Backend utility functions
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example            # Environment variables template
│   ├── startup.py              # Automated startup script
│   └── test_api.py             # API testing script
└── package.json          # Frontend dependencies and scripts
```

## Architecture Notes

### Full-Stack Architecture
- **Frontend**: React SPA with TypeScript serving the user interface
- **Backend**: FastAPI service providing AI-powered drug analysis APIs
- **Communication**: REST APIs with Server-Sent Events for real-time streaming
- **AI Integration**: Multi-agent system using OpenAI GPT-4 and Google Gemini Pro
- **Data Sources**: Integration with FDA, PubMed, ClinicalTrials.gov, and Bright Data

### Component Architecture
- **Single Page Application**: Uses React Router with main routes defined in `App.tsx`
- **Component-based Design**: Modular components with clear separation of concerns
- **State Management**: Uses React state and React Query for server state
- **UI Components**: Built on shadcn/ui design system with Radix UI primitives

### Key Application Flow
1. **Landing Page** (`Index.tsx`): Hero section with medication upload zone and health analysis features
2. **Medication Analysis**: Supports file upload (drag & drop) and manual drug name entry
3. **Health Analysis**: Concern and symptom tracker with voice input support
4. **Action Processing**: Various analysis actions (overview, picturize, visualize, health analysis)
5. **Results Display**: Shows processed insights, analysis results, and natural remedy recommendations

### Styling System
- **Design System**: Custom design system extending shadcn/ui
- **CSS Variables**: Uses HSL color variables for theming
- **Glass Morphism**: Custom glass-card and glass-panel classes for modern UI
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Custom Gradients**: Branded gradient classes (bg-gradient-primary, bg-gradient-hero)

### File Upload System
- **Drag & Drop**: Native HTML5 drag and drop API
- **File Types**: Supports prescription images, medication photos
- **Manual Entry**: Text input for direct medication name entry

## Key Configuration Files

### Frontend Configuration
- **`components.json`**: shadcn/ui configuration with path aliases
- **`tailwind.config.ts`**: Extended Tailwind configuration with custom theme
- **`vite.config.ts`**: Vite configuration with path aliases and development server settings
- **`eslint.config.js`**: ESLint configuration for TypeScript and React

### Backend Configuration
- **`backend/.env`**: Environment variables for API keys and configuration
- **`backend/.env.example`**: Template for required environment variables
- **`backend/requirements.txt`**: Python dependencies for FastAPI backend
- **`backend/app/core/config.py`**: Application configuration and settings

## Environment Setup

### Backend Environment Variables
The backend requires several API keys to be configured in `backend/.env`:

```env
# Required: AI Models (at least one)
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_gemini_key_here

# Required: Data Intelligence
BRIGHT_DATA_API_KEY=your_bright_data_key_here

# Optional: Database and Cache
DATABASE_URL=sqlite:///./app.db
REDIS_URL=redis://localhost:6379
```

### Quick Start
1. Copy `backend/.env.example` to `backend/.env`
2. Add your API keys to the `.env` file
3. Run `npm run setup` to install all dependencies
4. Run `npm run fullstack` to start both frontend and backend

### API Endpoints
- **Frontend**: http://localhost:8080 (Vite dev server)
- **Backend API**: http://localhost:8000 (FastAPI)
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Health Check**: http://localhost:8000/health

## Development Guidelines

### Adding New Components
- Place UI components in `src/components/ui/` for design system components
- Place feature components in `src/components/` for application-specific components
- Follow the existing TypeScript interfaces and prop patterns

### Working with shadcn/ui
- Use `npx shadcn-ui@latest add [component]` to add new UI components
- All UI components are automatically configured to work with the existing theme
- Customize components in place rather than modifying the base components

### State Management Patterns
- Use React Query for server state and data fetching
- Use React state (useState) for local component state
- Pass data between components via props or lift state up when needed

### Styling Conventions
- Use Tailwind utility classes for styling
- Leverage the custom design tokens (glass-card, glass-panel, etc.)
- Follow the established color scheme using CSS custom properties
- Use the `cn()` utility from `@/lib/utils` for conditional classes

## Path Aliases

The project uses the following path aliases (configured in `vite.config.ts` and `components.json`):
- `@/` → `./src/`
- `@/components` → `./src/components`
- `@/lib` → `./src/lib`
- `@/hooks` → `./src/hooks`
- `@/ui` → `./src/components/ui`

## Deployment

This project is designed to work with Lovable's deployment platform but can be deployed to any static hosting service since it's a client-side React application.