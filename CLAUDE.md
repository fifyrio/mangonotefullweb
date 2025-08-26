# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MangoNote is a Next.js-based AI-powered study app that transforms any source (PDF, audio, text) into comprehensive study materials including mind maps, flashcards, and quizzes. The app follows a dark theme with mango accent colors and implements a complete **Input → Generation → Review** user journey.

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint code quality checks

# Package management
npm install          # Install all dependencies
```

## Tech Stack & Dependencies

- **Core**: Next.js 14.0.1 (App Router), React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.3+, Sass, PostCSS
- **UI Libraries**: AOS (animations), Swiper (carousels), FSLightbox React (modals), RemixIcon
- **Analytics**: Vercel Analytics & Speed Insights
- **Development**: ESLint, TypeScript strict mode

## Architecture Overview

### App Router Structure
The project uses Next.js 14 App Router with the following route structure:
- `/` - Landing page with MangoNote branding
- `/auth/signin` & `/auth/signup` - Authentication pages
- `/dashboard` - Main app dashboard with sidebar navigation
- `/notes/[id]` - Individual note detail with tabbed interface
- `/processing` - AI generation progress tracker

### Key Components Architecture

**Sidebar Component (`src/components/Sidebar.tsx`)**
- Shared navigation component used across dashboard and note detail pages
- Uses `usePathname()` for active state management
- Contains navigation items, usage meter, upgrade prompts, and user profile
- Accepts `className` prop for layout flexibility

**Layout System**
- Root layout (`src/app/layout.tsx`) sets up dark mode with `className="dark"` on `<html>`
- Global styles in `src/app/globals.css` define the design system

### Design System Implementation

**Color Palette (Tailwind Config)**
```typescript
'dark': {
  'primary': '#121212',    // Main background
  'secondary': '#1A1A1A',  // Secondary background  
  'tertiary': '#2C2C2C',   // Card/modal background
  'surface': '#333333'     // Interactive surfaces
},
'mango': {
  '500': '#FFC300',        // Primary accent (buttons, links)
  // ... full mango palette 50-900
}
```

**Component Classes (globals.css)**
- `.btn-primary` - Mango background, black text, hover states
- `.btn-secondary` - Dark background with border, white text
- `.input-field` - Dark inputs with mango focus states
- `.sidebar-item` - Navigation item styling with active states

### Page Implementation Patterns

**Authentication Pages**
- Centered card layout with mango CTA buttons
- Social login options (Google, Apple)
- Form validation and state management

**Dashboard Layout**
- Left sidebar navigation (Sidebar component)
- Main content area with note creation options
- Recent notes list with metadata

**Note Detail Page**
- Shared Sidebar component for consistency
- Tabbed interface: Summary & Notes, Mind Map, Flashcards, Quiz
- Action buttons: Export, Rename, Delete

**Processing Page**
- Step-by-step progress indicator
- Real-time status updates with different states (completed, progress, pending)
- Auto-navigation to completed note

## Design Guidelines

**Component Development**
- Use shared Sidebar component for consistent navigation
- Implement responsive design with Tailwind breakpoints
- Follow the established color palette and component classes
- Use emoji icons consistently (📄, 📁, ❓, 📅)

**State Management**
- `usePathname()` for navigation active states
- `useState()` for local component state (tabs, forms)
- Client components marked with `'use client'`

**Styling Conventions**
- Dark mode is enforced via `className="dark"` on root HTML
- Use custom Tailwind color classes (`dark-primary`, `mango-500`)
- Component-level CSS classes defined in globals.css
- Inter font family loaded from Google Fonts

## Future Development Areas

Based on `产品需求.md`, planned features include:
- AI content generation (mind maps, quizzes, flashcards)
- Spaced repetition system with calendar scheduling
- PDF and audio file processing
- Interactive study interfaces
- User progress tracking and analytics

## File Structure Reference

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication flows
│   ├── dashboard/         # Main dashboard
│   ├── notes/[id]/        # Dynamic note detail pages
│   ├── processing/        # AI generation progress
│   ├── layout.tsx         # Root layout with dark mode
│   └── globals.css        # Design system styles
├── components/            # Reusable React components
│   └── Sidebar.tsx        # Shared navigation sidebar
└── UI/                    # Design mockup references
```

## Additional Documentation

- `产品需求.md` - Complete MVP requirements and user journey (Chinese)
- `技术栈.md` - Technical specifications and dependencies (Chinese)
- `UI/` directory contains design mockups for reference