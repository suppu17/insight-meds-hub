# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Insight Meds Hub is a healthcare web application that provides AI-powered medication analysis and insights. Users can upload prescription photos, medication images, or manually enter drug names to receive comprehensive medical information, safety analysis, and personalized guidance.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router DOM
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation

## Development Commands

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

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components (auto-generated)
│   ├── UploadZone.tsx   # File upload and manual entry component
│   ├── ActionButtons.tsx # Main action buttons for analysis
│   ├── ResultsDisplay.tsx # Results and insights display
│   ├── MedInsightLogo.tsx # App logo component
│   └── AdditionalFeatures.tsx # Additional feature tiles
├── pages/               # Page components
│   ├── Index.tsx        # Main application page
│   └── NotFound.tsx     # 404 page
├── lib/                 # Utilities
│   └── utils.ts         # Shared utility functions
├── hooks/               # Custom React hooks
├── assets/              # Static assets
└── main.tsx            # Application entry point
```

## Architecture Notes

### Component Architecture
- **Single Page Application**: Uses React Router with main routes defined in `App.tsx`
- **Component-based Design**: Modular components with clear separation of concerns
- **State Management**: Uses React state and React Query for server state
- **UI Components**: Built on shadcn/ui design system with Radix UI primitives

### Key Application Flow
1. **Landing Page** (`Index.tsx`): Hero section with upload zone and action buttons
2. **Upload Handling**: Supports file upload (drag & drop) and manual medication entry
3. **Action Processing**: Various analysis actions trigger results view
4. **Results Display**: Shows processed insights and analysis results

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

- **`components.json`**: shadcn/ui configuration with path aliases
- **`tailwind.config.ts`**: Extended Tailwind configuration with custom theme
- **`vite.config.ts`**: Vite configuration with path aliases and development server settings
- **`eslint.config.js`**: ESLint configuration for TypeScript and React

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