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

## Recent Changes

### June 14, 2025
- **Critical Fixes for Infinite Recurring Transaction System**: Resolved date validation and deletion issues
  - Fixed date validation: infinite transactions only appear from their original month forward
  - Prevented transactions from showing in months prior to their creation date
  - Enhanced deletion system with complete series removal option
  - Added "delete all instances" functionality for entire recurring series
  - Improved modal with clear options: single occurrence vs entire series deletion
  - Implemented batch deletion using `recurrenceGroupId` for optimal performance
  - Added fallback deletion logic for transactions without `recurrenceGroupId`
  - Dynamic generation triggers only for valid future months (>= original date)
  - Comprehensive logging tracks generation and deletion operations
  - System maintains data integrity across all temporal operations

- **Fixed Date Saving Issue**: Corrected timezone problems when saving transaction dates
  - Date input now correctly saves the selected date without day shift
  - Implemented proper date parsing to avoid browser timezone adjustments
  - Transactions now save with accurate date information as selected by user

- **Improved Infinite Recurring Transaction Messages**: Removed misleading "12 months" reference
  - Infinite recurring transactions now show appropriate "infinite" messaging
  - Fixed recurring transactions show specific duration (months or end date)
  - Clear distinction between infinite and fixed-term recurring transactions
  - Better user feedback with accurate descriptions for each type

- **Enhanced User Experience for Variable Recurring Transactions**: Improved visual identification and management
  - Added "Recorrente Variável" badge for transactions with `recurring: true` and `isVariableAmount: true`
  - Distinguished from regular recurring transactions with different badge styling
  - Implemented warning button (pencil icon) for undefined values in variable transactions
  - Added hover tooltip "Definir valor para este mês" for clarity
  - One-click access to edit modal for setting monthly values
  - Applied consistently across Transactions and TransactionsMonthly pages

- **Default Month Navigation Enhancement**: All pages now open to current month
  - System automatically detects browser's current date and timezone
  - Pages load directly to current month instead of fixed or creation month
  - Consistent behavior across Dashboard, Transactions, and Predictability pages
  - Improved user workflow by starting with most relevant timeframe

- **Fixed AddTransactionModal Form Reset Issue**: Implemented automatic form clearing when modal opens
  - Added useEffect to automatically reset all form fields when modal opens
  - Form now clears previous transaction data and starts fresh each time
  - Reset includes all fields: description, amount, category, date, type, status, source, and recurring options
  - Display amount field also resets to prevent showing previous values
  - Default values properly restored on each modal opening

- **Complete Edit Button Implementation for All Transaction Pages**: Added comprehensive transaction editing functionality
  - Modern blue edit button with Lucide React Edit icon and smooth hover transitions
  - Properly aligned with delete button in actions column with consistent styling
  - Professional tooltip and visual feedback on hover (blue background highlight)
  - Real-time table updates using Firestore listeners - no manual refresh needed
  - Automatic modal close and data refresh after successful edits
  - Brazilian currency formatting maintained (displays "R$ 845,84", accepts "845,84" input)
  - Success toast notifications for user feedback
  - Complete integration with existing EditTransactionModal component
  - Implemented on both Transactions.tsx and TransactionsMonthly.tsx pages

- **Enhanced Recurring Transaction Deletion System**: Implemented granular control for deleting recurring transactions
  - Modern SweetAlert2 modal with improved visual design, icons, and animations
  - Three deletion options: current occurrence only, all future occurrences, or cancel
  - Added `recurrenceGroupId` field to optimize Firestore queries and reduce index requirements
  - Implemented real-time UI updates with fade-out animations during deletion
  - Fallback support for legacy transactions without `recurrenceGroupId`
- **Optimized Firestore Performance**: 
  - Reduced complex composite indexes by using `recurrenceGroupId` for grouping
  - Implemented efficient batch deletion with only 2 query filters instead of 6+
  - Added comprehensive Firestore index documentation
- **Improved User Experience**:
  - Professional modal design with colored buttons, warning icons, and smooth animations
  - Real-time table updates without manual refresh required
  - Visual feedback during deletion process with transition effects
  - Clear success/error messages with detailed descriptions

### December 13, 2024
- **Fixed Firestore Index Error**: Resolved query index requirements by simplifying database queries to remove redundant userId filters
- **Implemented Automatic Recurring Transactions**: Added system to automatically replicate recurring transactions for 12 future months
- **Enhanced Transaction Management**: 
  - Transactions marked as `recurring: true` now auto-generate future instances
  - Each future transaction maintains same amount, category, description but with `status: "pending"`
  - Proper date calculation handles month-end edge cases (e.g., Jan 31 → Feb 28/29)
  - Added duplicate detection to prevent multiple recurring series creation
- **Improved User Feedback**: Modal now shows specific messages when recurring transactions are created
- **Added Batch Operations**: Functions to delete entire recurring transaction series and view all instances

## Changelog

Changelog:
- June 13, 2025. Initial setup
- December 13, 2024. Recurring transactions system and Firestore optimization