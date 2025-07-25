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

### June 15, 2025
- **Comprehensive Scenario Simulation System**: Transformed Predictability page into advanced financial decision-making tool
  - **"What if?" Simulator**: New ScenarioSimulator component with modal interface for creating income/expense scenarios
  - **Real-time Projection Updates**: All KPIs, charts, and tables react instantly to scenario toggles
  - **Financial Health Indicators**: Added Taxa de Poupança, Comprometimento, and Meses de Fôlego with color-coded thresholds
  - **Enhanced Visualizations**: Area charts with negative balance highlighting, reference lines, and gradient fills
  - **Smart Recommendations Engine**: AI-generated financial advice based on projection analysis
  - **Investment Scenario Analysis**: Collapsed accordion with 10-50% investment options and return calculations
  - **Modular Architecture**: Created utils/projection.ts with reusable financial calculation functions
  - **SimulatedItem Type System**: Complete type safety for scenario management with enable/disable functionality
  - **Period Labels Refinement**: Cleaned up period options (e.g., "10 anos" instead of "120 meses (10 anos)")
  - **Simulation Badges**: Visual indicators when scenarios are active across all financial displays
  - **Enhanced KPI Cards**: Added payment status breakdown to TransactionsMonthly page with 6 comprehensive metrics

- **Universal Month/Year Picker Component**: Created unified MonthYearPicker component for consistent navigation across all pages
  - Extracted common date picker functionality into `components/MonthYearPicker.tsx`
  - Implemented on Dashboard, Transactions, and TransactionsMonthly pages
  - Click on month name opens popup with year and month selectors
  - Quick selection buttons for "Mês Atual" and "Mês Anterior"
  - Year selector covers 10-year range (5 years before/after current)
  - Month selector displays full Portuguese month names  
  - Maintains existing arrow button navigation for step-by-step browsing
  - Identical appearance, fonts, colors and animations across all financial pages
  - Eliminates code duplication and ensures consistent user experience
  - Accessible design with proper focus management and ESC key support

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

- **Enhanced Transaction Counting and Visualization**: Improved data analysis capabilities
  - Added transaction count summary at top of transaction tables
  - Visual breakdown showing total transactions, income count, and expense count
  - Sequential numbering (#1, #2, #3...) for all transactions in tables
  - Applied consistently across Transactions and TransactionsMonthly pages
  - Clear visual indicators with emojis (📌 Total, ✅ Receitas, ❌ Despesas)

- **Major Dashboard Chart Improvements**: Enhanced visual analysis and readability
  - Increased chart sizes from small containers to 320px height (h-80)
  - Improved pie chart with larger radius (120px) and direct percentage labels
  - Enhanced legends showing both absolute values (R$) and percentages
  - Detailed category breakdown with individual cards for each category
  - Line chart improvements with thicker lines, larger dots, and better tooltips
  - Enhanced tooltip styling with larger fonts and better contrast
  - Period filter options (3, 6, 12, 18 months) for evolution charts
  - Better spacing and typography throughout dashboard charts
  - Improved color contrast and visual hierarchy for better readability

- **Dashboard User Experience Enhancements**: Improved tooltips and navigation
  - Pie chart tooltips now show category name along with value and percentage
  - Enhanced tooltip design with proper formatting and clear information hierarchy
  - "Ver todas" button in recent transactions now redirects to transactions page
  - Better navigation flow between Dashboard and detailed transaction views

- **Sidebar Menu Visual Overhaul**: Professional design with enhanced usability
  - Added proper icon for "Previsibilidade" menu item (fas fa-chart-line)
  - Improved collapse button positioning and styling with blue accent colors
  - Enhanced visual design with gradient backgrounds and rounded corners
  - Better hover effects and active state indicators with shadow effects
  - Improved responsive design for mobile and desktop viewing
  - Enhanced user profile section with better typography and layout
  - Added proper logout button styling with red accent for clear action indication

- **Dashboard Próximos Vencimentos Fix**: Corrected data filtering for accurate expense tracking
  - Fixed "Próximos Vencimentos" card to show only unpaid expenses (despesas)
  - Removed income transactions from upcoming payments display
  - Filter now correctly shows only pending expenses with due dates
  - Improved financial accuracy by focusing on actual bills and expenses due

- **Comprehensive Previsibilidade Page Overhaul**: Transformed into strategic financial planning tool
  - **Flexible Period Filtering**: 7 period options from 3 months to 120 months (10 years)
  - **Variable Recurring Transaction Validation**: System requires values for all variable recurring transactions
  - **Accumulated Balance Projections**: Charts show month-by-month accumulated balance evolution
  - **Enhanced Visual Charts**: Larger charts with responsive design and detailed tooltips
  - **Detailed Projection Tables**: Complete monthly breakdown with income, expenses, and balances
  - **Summary Statistics**: Total projections, final balance, and monthly averages
  - **Current Balance Integration**: Real-time calculation from paid transactions
  - **Professional Design**: Motion animations and comprehensive financial analysis interface

- **Critical Variable Recurring Transaction Fix**: Resolved amount field inheritance issues
  - Fixed variable recurring transactions to properly inherit original amount values
  - Removed logic that set `amount: null` for variable transactions in future instances
  - Both infinite and fixed recurring transactions now preserve original amount values
  - Enhanced predictability accuracy by ensuring all transactions have base values
  - Variable transactions maintain original value until manually edited per month
  - Fixed generation logic in both `generateInfiniteRecurringTransactionForMonth` and `generateRecurringTransactions`

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