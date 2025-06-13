# Previzi - Personal Financial Management System

## Overview

Previzi is a comprehensive personal financial management system built with React, Firebase, and Express.js. The application focuses on providing predictability, tranquility, and control over personal finances through features like transaction management, recurring payments, monthly views, and financial projections.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API for authentication, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **UI Components**: Radix UI primitives via shadcn/ui

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: Configured for PostgreSQL with Drizzle ORM (currently using in-memory storage)
- **Authentication**: Firebase Authentication
- **Data Storage**: Firebase Firestore for production data
- **Session Management**: Built-in session handling

### Build System
- **Bundler**: Vite for development and build
- **Development**: Hot module replacement with Vite dev server
- **Production**: ESBuild for server bundling

## Key Components

### Authentication System
- Firebase Authentication with email/password and Google OAuth
- Protected routes with authentication context
- User registration and login flows
- Password reset functionality

### Transaction Management
- CRUD operations for income and expense transactions
- Recurring transaction support (fixed and variable)
- Monthly transaction grouping with `monthRef` field
- Transaction status tracking (paid/pending)
- Category-based organization

### Data Models
- **TransactionType**: Core transaction entity with recurring support
- **CategoryType**: User-defined income/expense categories
- **ProjectionType**: Financial projections and planning
- **UserSettingsType**: User preferences and configuration

### UI Features
- Responsive design with mobile-first approach
- Dark/light theme support
- Interactive charts and visualizations
- Modal dialogs for data entry
- Toast notifications for user feedback

## Data Flow

1. **Authentication**: User authenticates via Firebase Auth
2. **Data Fetching**: TanStack Query manages server state and caching
3. **Transaction Processing**: Firestore handles CRUD operations with optimistic updates
4. **Recurring Transactions**: Automatic generation of future transactions
5. **Monthly Aggregation**: Data grouped by `monthRef` for monthly views
6. **Real-time Updates**: Firebase listeners provide live data synchronization

## External Dependencies

### Firebase Services
- **Authentication**: User management and OAuth
- **Firestore**: Primary database for production data
- **Configuration**: Environment-based Firebase project setup

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Heroicons**: Icon system
- **Framer Motion**: Animation library
- **Recharts**: Chart visualization

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Development server and build tool

## Deployment Strategy

### Development Environment
- Replit-based development with hot reloading
- PostgreSQL module for database development
- Environment variable configuration

### Production Considerations
- Vite build process for optimized client bundle
- Express server with ESBuild compilation
- Static asset serving through Express
- Environment-based configuration switching

### Database Strategy
- Development: In-memory storage with Drizzle schema
- Production: PostgreSQL with Drizzle ORM migrations
- Firebase Firestore as primary production database

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 13, 2025. Initial setup