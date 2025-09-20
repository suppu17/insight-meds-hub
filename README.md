# MedInsight Hub 🏥

**AI-Powered Medical Intelligence Platform**

MedInsight Hub is a comprehensive healthcare application that empowers users with AI-driven insights for smarter health decisions and personalized care. The platform combines drug analysis, symptom tracking, medical OCR, and advanced AI capabilities to provide a complete healthcare management solution.

## 🌟 Key Features

### 🔬 **Drug Analysis & Education**
- Comprehensive drug information and analysis
- Drug interaction checking
- Visual medication guides
- Clinical research integration

### 🩺 **AI-Powered Symptom Analysis**
- Intelligent symptom checker with AI analysis
- Symptom tracking and history management
- Professional PDF report generation for healthcare providers
- Severity tracking and trend analysis

### 🎙️ **Voice AI ChatBot**
- Real-time voice interaction for health queries
- Natural language processing for medical questions
- Conversational health assistance

### 📄 **Medical OCR & Document Processing**
- Extract text from medical documents and prescriptions
- Process medical images and reports
- Automated data entry from physical documents

### 🔐 **Secure Authentication**
- Stytch-powered authentication with magic links
- Secure user sessions and data protection
- Protected routes and user management

### 📊 **Advanced Analytics**
- Health data visualization with Recharts
- Trend analysis and insights
- Comprehensive reporting capabilities

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern styling
- **shadcn/ui** for beautiful UI components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Recharts** for data visualization
- **jsPDF** for PDF generation

### Backend
- **FastAPI** for high-performance API
- **Python 3.x** with async/await support
- **AWS Bedrock** for AI/ML capabilities
- **AWS S3** for file storage
- **Redis Cloud** for caching and session management
- **Uvicorn** ASGI server

### AI & ML Integration
- **AWS Bedrock Runtime** for AI analysis
- **Tesseract.js** for OCR capabilities
- **FFmpeg** for media processing
- **FAL.ai** for advanced AI features

### Data Collection & Web Scraping
- **Bright Data** for reliable web data collection
- **Proxy networks** for scalable data fetching
- **Real-time data extraction** from medical databases

### Authentication & Security
- **Stytch** for passwordless authentication
- **JWT** token management
- **CORS** middleware for secure cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- AWS Account (for Bedrock and S3)
- Redis Cloud account
- Stytch account

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd insight-meds-hub
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run backend:setup
```

3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables:
# - AWS credentials and region
# - Stytch API keys
# - Redis Cloud connection
# - Other service configurations
```

4. **Start the application**
```bash
# Start both frontend and backend
npm run fullstack

# Or start individually:
npm run dev          # Frontend only
npm run backend:dev  # Backend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
insight-meds-hub/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and services
│   └── assets/            # Static assets
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configurations
│   │   └── middleware/   # Custom middleware
│   └── tests/            # Backend tests
├── public/               # Static public files
└── docs/                # Documentation files
```

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run backend:dev` - Start backend in development mode
- `npm run backend:start` - Start backend in production mode
- `npm run backend:test` - Run backend tests

### Full Stack
- `npm run fullstack` - Start both frontend and backend
- `npm run setup` - Install all dependencies

## 🔐 Authentication Flow

MedInsight Hub uses Stytch for secure, passwordless authentication:

1. **Magic Link Authentication**: Users receive secure login links via email
2. **Session Management**: Secure session handling with automatic token refresh
3. **Protected Routes**: Authenticated access to sensitive features
4. **User Management**: Complete user profile and preferences management

## 📊 Key Features Deep Dive

### Symptom Analysis & Reporting
- **AI-Powered Analysis**: Advanced symptom analysis using AWS Bedrock
- **PDF Report Generation**: Professional medical reports for healthcare providers
- **Trend Tracking**: Monitor symptom patterns over time
- **Severity Scoring**: Intelligent severity assessment and alerts

### Drug Information System
- **Comprehensive Database**: Extensive drug information and interactions powered by Bright Data
- **Real-time Data Collection**: Up-to-date drug information from multiple medical sources
- **Visual Guides**: Interactive medication guides and instructions
- **Safety Alerts**: Drug interaction warnings and contraindications
- **Clinical Research**: Access to latest clinical studies and research data

### Medical OCR Processing
- **Document Scanning**: Extract text from prescriptions and medical documents
- **Image Processing**: Advanced image analysis for medical documents
- **Data Extraction**: Automated extraction of key medical information
- **Integration**: Seamless integration with existing health records

## 🌐 API Documentation

The backend API provides comprehensive endpoints for:
- `/api/v1/drug-analysis` - Drug information and analysis with Bright Data integration
- `/api/v1/health-analysis` - Symptom analysis and health insights
- `/api/v1/medical-ocr` - OCR processing endpoints
- `/api/v1/cache` - Caching and data management
- `/api/v1/data-collection` - Bright Data web scraping and data fetching
- `/auth` - Authentication and user management

Full API documentation is available at `/docs` when running the backend server.

## 🔒 Security & Privacy

- **Data Encryption**: All sensitive data encrypted in transit and at rest
- **HIPAA Compliance**: Healthcare data handling following best practices
- **Secure Authentication**: Passwordless authentication with Stytch
- **Privacy First**: User data privacy and consent management

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in the `/docs` folder
- Review the API documentation at `/docs` endpoint
- Open an issue for bug reports or feature requests

## 🚀 Deployment

The application can be deployed using various platforms:
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: AWS EC2, Docker containers, or serverless platforms
- **Database**: AWS RDS, MongoDB Atlas, or managed database services

For detailed deployment instructions, see the deployment documentation in the `/docs` folder.
