# CLAUDE.md - AI Assistant Guide for Expense Tracker

> **Last Updated:** 2025-11-19
> **Project:** Expense Tracker (Saver)
> **Version:** 1.0.0

This document provides comprehensive guidance for AI assistants (like Claude) working with this codebase. It explains the architecture, conventions, and workflows to help you make informed decisions when assisting with development tasks.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Patterns](#architecture--patterns)
4. [Directory Structure](#directory-structure)
5. [Database Schema](#database-schema)
6. [API Conventions](#api-conventions)
7. [Component Patterns](#component-patterns)
8. [Styling Guidelines](#styling-guidelines)
9. [Development Workflows](#development-workflows)
10. [Common Tasks](#common-tasks)
11. [Code Conventions](#code-conventions)
12. [Testing Guidelines](#testing-guidelines)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is This Application?

A **mobile-first expense tracking web application** designed for quick, personal expense logging with automatic import from bank transaction emails.

**Key Features:**
- Manual expense entry (optimized for 5-second logging)
- Automatic expense import from VIB and Grab transaction emails
- Budget tracking and analytics
- Savings goals
- Progressive Web App (PWA) with offline support
- Push notifications for budget alerts
- Beautiful animations and glass morphism UI

**Target Users:**
- Personal finance-conscious individuals in Vietnam
- Users who want to track daily spending quickly on mobile devices
- People receiving VIB or Grab transaction emails

**Design Philosophy:**
- Mobile-first (thumb-friendly, one-handed use)
- Quick input (minimal typing, large touch targets)
- Visual feedback (smooth animations, clear states)
- Fast performance (optimistic updates)

---

## Technology Stack

### Core Framework
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety

### Backend & Database
- **Supabase (PostgreSQL)** - Database with Row Level Security
- **Next.js API Routes** - Serverless functions
- **IMAP + Mailparser** - Email parsing

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Composable component library
- **Framer Motion 10.16** - Animation library
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon library

### Charts & Data Visualization
- **Recharts 2.15** - Chart components

### Utilities
- **date-fns 3.6** - Date manipulation
- **canvas-confetti** - Celebration effects
- **next-themes** - Theme management
- **sonner** - Toast notifications
- **react-intersection-observer** - Lazy loading triggers

### PWA
- **web-push** - Push notifications
- Service Workers - Offline support

---

## Architecture & Patterns

### Application Architecture

```
┌─────────────────────────────────────────┐
│           Browser (Client)              │
│  ┌────────────────────────────────────┐ │
│  │  Next.js App Router (page.tsx)    │ │
│  │  - Single Page App (SPA)          │ │
│  │  - View state management          │ │
│  │  - Local React state              │ │
│  └────────────────────────────────────┘ │
│              ↓ fetch API                │
└──────────────┼──────────────────────────┘
               ↓
┌──────────────┼──────────────────────────┐
│  Next.js API Routes (Serverless)        │
│  ┌────────────────────────────────────┐ │
│  │ /api/expenses                      │ │
│  │ /api/stats                         │ │
│  │ /api/budgets                       │ │
│  │ /api/goals                         │ │
│  │ /api/email/sync                    │ │
│  └────────────────────────────────────┘ │
│              ↓ Supabase client          │
└──────────────┼──────────────────────────┘
               ↓
┌──────────────┼──────────────────────────┐
│        Supabase (PostgreSQL)            │
│  - expenses table (main)                │
│  - categories table                     │
│  - budgets table                        │
│  - goals table                          │
│  - push_subscriptions table             │
└─────────────────────────────────────────┘
```

### State Management Pattern

**No global state library** - Uses React's built-in hooks:

```typescript
// Component State Pattern
const [expenses, setExpenses] = useState<Expense[]>([])
const [filters, setFilters] = useState({ category: null, merchant: null })
const [activeView, setActiveView] = useState('expenses')

// Data Fetching Pattern
useEffect(() => {
  fetchExpenses()
}, [filters])

// Optimistic Update Pattern
const handleDelete = async (id: string) => {
  // 1. Save current state
  const previous = [...expenses]

  // 2. Update UI immediately (optimistic)
  setExpenses(expenses.filter(e => e.id !== id))

  try {
    // 3. Call API
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
  } catch (error) {
    // 4. Rollback on error
    setExpenses(previous)
    toast.error('Failed to delete')
  }
}
```

### Data Flow

```
User Action (Click/Swipe/Type)
    ↓
Component State Update (optimistic)
    ↓
API Call (fetch to /api/*)
    ↓
API Route Handler (Next.js)
    ↓
Supabase Client (database operation)
    ↓
Database Update (PostgreSQL)
    ↓
Return Response
    ↓
Refetch Data (or use optimistic result)
    ↓
UI Update (re-render)
    ↓
Toast Notification (success/error)
```

### Routing Strategy

**Single Page Application (SPA)** with view state:

- No multi-page routing (all on `app/page.tsx`)
- Bottom navigation switches `activeView` state
- Views: `expenses`, `analytics`, `budget`, `goals`, `summary`, `insights`
- URLs don't change (could add query params for deep linking later)

**Important:** This is intentionally a single-page app for mobile-first experience. Don't create new pages unless specifically required.

---

## Directory Structure

```
saver/
├── app/                              # Next.js App Router
│   ├── api/                          # API Routes (serverless functions)
│   │   ├── expenses/
│   │   │   ├── route.ts             # GET (list), POST (create)
│   │   │   └── [id]/route.ts        # PUT (update), DELETE
│   │   ├── email/
│   │   │   └── sync/route.ts        # POST - Email sync
│   │   ├── stats/route.ts           # GET - Analytics data
│   │   ├── budgets/
│   │   │   ├── route.ts             # GET, POST
│   │   │   └── [id]/route.ts        # PUT, DELETE
│   │   ├── goals/
│   │   │   ├── route.ts             # GET, POST
│   │   │   └── [id]/route.ts        # PUT, DELETE
│   │   ├── merchants/
│   │   │   └── suggest-category/route.ts  # POST - AI category suggestion
│   │   └── notifications/
│   │       ├── subscribe/route.ts   # POST
│   │       └── unsubscribe/route.ts # POST
│   ├── page.tsx                      # Main dashboard (1200+ lines)
│   ├── layout.tsx                    # Root layout with providers
│   └── globals.css                   # Global styles & CSS variables
│
├── components/                       # React components
│   ├── ui/                           # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── progress.tsx
│   │   ├── popover.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   └── calendar.tsx
│   │
│   ├── Feature Components (alphabetically):
│   │   ├── analytics-charts.tsx      # Pie/line charts
│   │   ├── animated-counter.tsx      # Number animations
│   │   ├── bottom-navigation.tsx     # Mobile nav
│   │   ├── budget-tracker.tsx        # Budget management
│   │   ├── category-insights.tsx     # Spending insights
│   │   ├── email-sync-button.tsx     # Sync UI
│   │   ├── expandable-expense-card.tsx  # Main expense card
│   │   ├── expense-card.tsx          # Simple expense card
│   │   ├── expense-filters.tsx       # Filter controls
│   │   ├── floating-action-menu.tsx  # FAB menu
│   │   ├── network-status.tsx        # Offline indicator
│   │   ├── onboarding.tsx            # First-time flow
│   │   ├── progress-indicator.tsx    # Sync progress
│   │   ├── push-notification-manager.tsx
│   │   ├── pwa-install-prompt.tsx    # Install banner
│   │   ├── quick-expense-form.tsx    # Add expense form
│   │   ├── savings-goals.tsx         # Goals tracking
│   │   ├── search-bar.tsx            # Search with autocomplete
│   │   ├── service-worker-registration.tsx
│   │   ├── skeleton-loader.tsx       # Loading states
│   │   ├── stats-card.tsx            # Summary cards
│   │   ├── theme-provider.tsx        # Theme context
│   │   └── weekly-summary.tsx        # Week analysis
│   │
│   └── confetti.ts                   # Celebration utility
│
├── lib/                              # Shared utilities
│   ├── supabase.ts                  # Supabase client & types
│   ├── email-service.ts             # IMAP email fetching
│   ├── email-parser.ts              # VIB & Grab parsing
│   ├── utils.ts                     # Helper functions
│   └── export.ts                    # CSV export
│
├── supabase/                         # Database
│   ├── schema.sql                   # Initial schema
│   ├── quick-start.sql              # Alternative setup
│   ├── migrations/                  # Migration files
│   └── MIGRATION_GUIDE.md           # Setup docs
│
├── public/                           # Static assets
│   ├── manifest.json                # PWA manifest
│   ├── icon-*.png                   # App icons
│   └── sw.js                        # Service Worker
│
├── .env.example                      # Environment template
├── .gitignore
├── components.json                   # shadcn/ui config
├── tailwind.config.ts               # Tailwind customization
├── tsconfig.json                    # TypeScript config
├── next.config.js                   # Next.js config
├── postcss.config.js                # PostCSS config
├── package.json
├── README.md                         # User documentation
├── UI_IMPROVEMENTS.md                # Recent UI changes
├── PWA_SETUP.md                      # PWA guide
└── CLAUDE.md                         # This file
```

### File Organization Conventions

1. **API Routes:** RESTful pattern with resource-based naming
2. **Components:** PascalCase files, kebab-case names (e.g., `quick-expense-form.tsx`)
3. **Utilities:** Lowercase with hyphens (e.g., `email-parser.ts`)
4. **Types:** Defined in `lib/supabase.ts` or colocated with components

---

## Database Schema

### Core Tables

#### `expenses` (Main Table)

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Required fields
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  transaction_date TIMESTAMPTZ NOT NULL,
  merchant TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'email')),

  -- Optional fields
  category TEXT DEFAULT 'Other',
  notes TEXT,

  -- Email-specific fields (only filled for source='email')
  card_number TEXT,
  cardholder TEXT,
  transaction_type TEXT DEFAULT 'Expense',
  email_subject TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Indexes for performance
CREATE INDEX idx_expenses_transaction_date ON expenses(transaction_date DESC)
CREATE INDEX idx_expenses_merchant ON expenses(merchant)
CREATE INDEX idx_expenses_category ON expenses(category)
CREATE INDEX idx_expenses_source ON expenses(source)
```

**TypeScript Type:**

```typescript
export type Expense = {
  id: string
  amount: number
  currency: string
  transaction_date: string  // ISO 8601
  merchant: string
  source: 'manual' | 'email'
  category?: string
  notes?: string
  card_number?: string
  cardholder?: string
  transaction_type?: string
  email_subject?: string
  created_at: string
  updated_at: string
}
```

#### `categories` (Metadata)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,  -- Hex color
  icon TEXT,   -- Emoji
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Default Categories:**
- Food & Dining (🍔)
- Shopping (🛍️)
- Transportation (🚗)
- Entertainment (🎬)
- Bills & Utilities (💡)
- Healthcare (🏥)
- Other (📦)

#### Other Tables (Inferred)

- `budgets` - Monthly category budgets
- `goals` - Savings goals
- `push_subscriptions` - PWA notification subscriptions

### Row Level Security (RLS)

Currently: **Open access** (all operations allowed)

```sql
CREATE POLICY "Allow all operations on expenses" ON expenses
    FOR ALL USING (true) WITH CHECK (true);
```

**TODO:** Add authentication and user-specific policies:

```sql
-- Future policy example (when auth is added)
CREATE POLICY "Users can only see their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);
```

---

## API Conventions

### RESTful Endpoints

All API routes follow REST conventions:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses` | List expenses (with filters) |
| `POST` | `/api/expenses` | Create new expense |
| `PUT` | `/api/expenses/[id]` | Update expense |
| `DELETE` | `/api/expenses/[id]` | Delete expense |
| `GET` | `/api/stats` | Get analytics data |
| `POST` | `/api/email/sync` | Trigger email sync |
| `GET/POST` | `/api/budgets` | Budget CRUD |
| `PUT/DELETE` | `/api/budgets/[id]` | Update/delete budget |
| `GET/POST` | `/api/goals` | Goals CRUD |
| `POST` | `/api/merchants/suggest-category` | AI category suggestion |

### Request/Response Patterns

#### GET `/api/expenses`

**Query Parameters:**
```typescript
{
  limit?: number       // Default: 10
  offset?: number      // Default: 0
  startDate?: string   // ISO 8601
  endDate?: string     // ISO 8601
  merchant?: string    // Filter by merchant name
  category?: string    // Filter by category
}
```

**Response:**
```json
{
  "expenses": [
    {
      "id": "uuid",
      "amount": 87000,
      "currency": "VND",
      "merchant": "Shopee",
      "category": "Shopping",
      "transaction_date": "2025-11-17T01:03:00Z",
      "source": "email",
      "notes": null,
      "created_at": "2025-11-17T01:05:00Z"
    }
  ],
  "total": 150
}
```

#### POST `/api/expenses`

**Request Body:**
```json
{
  "amount": 50000,
  "currency": "VND",
  "merchant": "Starbucks",
  "category": "Food",
  "transaction_date": "2025-11-19T10:30:00Z",
  "notes": "Morning coffee",
  "source": "manual"
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "amount": 50000,
  "merchant": "Starbucks",
  ...
}
```

#### POST `/api/email/sync`

**Request Body:**
```json
{
  "days": 7  // Optional: number of days to sync (default: 30)
}
```

**Response:**
```json
{
  "success": true,
  "newExpenses": 5,
  "duplicates": 2,
  "errors": []
}
```

### Error Handling

All API routes follow this pattern:

```typescript
export async function GET(request: Request) {
  try {
    // Validate request
    // Fetch data
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Error Response Format:**
```json
{
  "error": "Error message here",
  "details": "Optional detailed message"
}
```

---

## Component Patterns

### Feature Component Pattern

```typescript
// components/feature-name.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FeatureProps {
  expenses: Expense[]
  onAction?: (data: any) => void
}

export function FeatureName({ expenses, onAction }: FeatureProps) {
  const [localState, setLocalState] = useState(null)

  // Derived data
  const processedData = expenses.reduce((acc, exp) => {
    // ... computation
    return acc
  }, {})

  // Handlers
  const handleClick = () => {
    onAction?.(processedData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Name</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
        <Button onClick={handleClick}>Action</Button>
      </CardContent>
    </Card>
  )
}
```

### Form Component Pattern

```typescript
// components/form-name.tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FormProps {
  onSubmit: (data: FormData) => Promise<void>
  initialData?: Partial<FormData>
}

export function FormName({ onSubmit, initialData }: FormProps) {
  const [formData, setFormData] = useState<FormData>(
    initialData || { amount: 0, merchant: '' }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ amount: 0, merchant: '' }) // Reset
    } catch (error) {
      toast.error('Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.amount}
        onChange={(e) => setFormData({
          ...formData,
          amount: parseFloat(e.target.value)
        })}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
```

### Animation Pattern (Framer Motion)

```typescript
import { motion, AnimatePresence } from 'framer-motion'

export function AnimatedComponent() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          Content
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### shadcn/ui Component Usage

Always use shadcn/ui components for consistency:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

// Usage
<Button variant="default" size="lg">Click Me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
```

---

## Styling Guidelines

### Tailwind CSS Patterns

#### Responsive Design

```tsx
// Mobile-first approach (default is mobile)
<div className="
  p-4           // Mobile padding
  md:p-6        // Tablet padding
  lg:p-8        // Desktop padding
  w-full
  md:w-1/2      // Half width on tablet+
  lg:w-1/3      // Third width on desktop+
">
```

#### Touch-Friendly Sizing

```tsx
// Use predefined touch target classes
<Button className="
  min-h-touch     // 48px minimum (thumb-friendly)
  touch-lg        // 56px for primary actions
  touch-xl        // 64px for critical actions
  w-full          // Full width on mobile
">
```

#### Glass Morphism

```tsx
// Use custom glass classes
<div className="
  glass           // Basic frosted glass effect
  rounded-2xl
  p-6
">

<Card className="frosted-card">
  {/* Enhanced glass card */}
</Card>
```

#### Color System

**Category Colors (use these consistently):**

```typescript
const CATEGORY_COLORS = {
  'Food': {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    border: 'border-l-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    icon: '🍔'
  },
  'Shopping': {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    border: 'border-l-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '🛍️'
  },
  // ... other categories
}
```

**Custom CSS Variables (from `globals.css`):**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --destructive: 0 84.2% 60.2%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

#### Animations

```tsx
// Predefined animations
<div className="
  animate-shimmer    // Shimmer loading effect
  hover-scale        // Scale on hover
  active-scale       // Scale on press
  ripple-effect      // Material ripple
">

// Framer Motion for complex animations
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
```

### Dark Mode

Always support dark mode:

```tsx
// Use dark: prefix for dark mode styles
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">

// Use theme-aware colors
<div className="bg-background text-foreground">
```

---

## Development Workflows

### Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure Supabase:**
   - Create project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in SQL Editor
   - Copy URL and anon key to `.env`

4. **Configure email (optional):**
   - Enable IMAP in Gmail
   - Generate App Password
   - Add credentials to `.env`

5. **Run development server:**
   ```bash
   npm run dev
   ```

### Development Process

1. **Before making changes:**
   - Read relevant components/files
   - Understand data flow
   - Check existing patterns

2. **When adding features:**
   - Create component in `components/`
   - Add API route if needed in `app/api/`
   - Update types in `lib/supabase.ts`
   - Test on mobile viewport
   - Ensure dark mode support

3. **Testing changes:**
   ```bash
   # Run on mobile device (same WiFi)
   # Find your local IP
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Access from phone
   http://YOUR-LOCAL-IP:3000
   ```

4. **Building for production:**
   ```bash
   npm run build
   npm start
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add feature description"

# Push to remote
git push -u origin feature/your-feature-name
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` Styling changes
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

---

## Common Tasks

### Adding a New Feature

**Example: Adding a "Recurring Expenses" feature**

1. **Database migration:**
   ```sql
   -- supabase/migrations/003_recurring_expenses.sql
   CREATE TABLE recurring_expenses (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     amount DECIMAL(15, 2) NOT NULL,
     merchant TEXT NOT NULL,
     frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
     next_date TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Add types:**
   ```typescript
   // lib/supabase.ts
   export type RecurringExpense = {
     id: string
     amount: number
     merchant: string
     frequency: 'daily' | 'weekly' | 'monthly'
     next_date: string
     created_at: string
   }
   ```

3. **Create API route:**
   ```typescript
   // app/api/recurring/route.ts
   export async function GET() {
     const { data } = await supabase
       .from('recurring_expenses')
       .select('*')
     return NextResponse.json({ data })
   }
   ```

4. **Create component:**
   ```typescript
   // components/recurring-expenses.tsx
   export function RecurringExpenses() {
     const [recurring, setRecurring] = useState([])

     useEffect(() => {
       fetch('/api/recurring').then(res => res.json())
         .then(data => setRecurring(data.data))
     }, [])

     return (
       <Card>
         <CardHeader>
           <CardTitle>Recurring Expenses</CardTitle>
         </CardHeader>
         <CardContent>
           {recurring.map(item => (
             <div key={item.id}>{item.merchant}</div>
           ))}
         </CardContent>
       </Card>
     )
   }
   ```

5. **Add to main page:**
   ```typescript
   // app/page.tsx
   import { RecurringExpenses } from '@/components/recurring-expenses'

   // In the component
   {activeView === 'recurring' && <RecurringExpenses />}
   ```

6. **Add to navigation:**
   ```typescript
   // components/bottom-navigation.tsx
   const navItems = [
     // ... existing items
     { id: 'recurring', icon: Repeat, label: 'Recurring' }
   ]
   ```

### Adding a New Email Parser

**Example: Adding support for ACB Bank emails**

1. **Update trusted senders:**
   ```typescript
   // lib/email-service.ts
   const TRUSTED_SENDERS = [
     'info@card.vib.com.vn',
     'no-reply@grab.com',
     'notifications@acb.com.vn'  // Add new sender
   ]
   ```

2. **Add parser method:**
   ```typescript
   // lib/email-parser.ts
   export function parseACBEmail(body: string, subject: string) {
     // Extract amount
     const amountMatch = body.match(/Amount:\s*([\d,]+)\s*VND/)
     const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0

     // Extract merchant
     const merchantMatch = body.match(/Merchant:\s*(.+)/)
     const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown'

     // Extract date
     const dateMatch = body.match(/Date:\s*(\d{2}\/\d{2}\/\d{4})/)
     const date = dateMatch ? parseDate(dateMatch[1]) : new Date()

     return {
       amount,
       merchant,
       transaction_date: date.toISOString(),
       currency: 'VND',
       source: 'email' as const,
       email_subject: subject
     }
   }
   ```

3. **Update main parser:**
   ```typescript
   // lib/email-parser.ts
   export async function parseEmail(email: any) {
     const from = email.from[0].address.toLowerCase()

     if (from === 'info@card.vib.com.vn') {
       return parseVIBEmail(body, subject)
     } else if (from === 'no-reply@grab.com') {
       return parseGrabEmail(body, subject)
     } else if (from === 'notifications@acb.com.vn') {
       return parseACBEmail(body, subject)  // Add new parser
     }

     return null
   }
   ```

### Adding a New Chart/Analytics

**Example: Adding a "Monthly Trends" chart**

1. **Create component:**
   ```typescript
   // components/monthly-trends.tsx
   import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

   export function MonthlyTrends({ expenses }: { expenses: Expense[] }) {
     // Group by month
     const monthlyData = expenses.reduce((acc, exp) => {
       const month = format(new Date(exp.transaction_date), 'MMM')
       acc[month] = (acc[month] || 0) + exp.amount
       return acc
     }, {})

     const chartData = Object.entries(monthlyData).map(([month, total]) => ({
       month,
       total
     }))

     return (
       <Card>
         <CardHeader>
           <CardTitle>Monthly Trends</CardTitle>
         </CardHeader>
         <CardContent>
           <LineChart width={300} height={200} data={chartData}>
             <XAxis dataKey="month" />
             <YAxis />
             <Tooltip />
             <Line type="monotone" dataKey="total" stroke="#8884d8" />
           </LineChart>
         </CardContent>
       </Card>
     )
   }
   ```

2. **Add to analytics view:**
   ```typescript
   // app/page.tsx
   {activeView === 'analytics' && (
     <>
       <AnalyticsCharts expenses={expenses} />
       <MonthlyTrends expenses={expenses} />  {/* Add here */}
     </>
   )}
   ```

### Updating Styles

**Example: Changing the primary color**

1. **Update Tailwind config:**
   ```typescript
   // tailwind.config.ts
   theme: {
     extend: {
       colors: {
         primary: {
           DEFAULT: 'hsl(var(--primary))',
           foreground: 'hsl(var(--primary-foreground))',
         },
       },
     },
   },
   ```

2. **Update CSS variables:**
   ```css
   /* app/globals.css */
   :root {
     --primary: 280 100% 70%;  /* Purple instead of blue */
   }

   .dark {
     --primary: 280 100% 80%;
   }
   ```

3. **Rebuild:**
   ```bash
   npm run dev  # Tailwind will regenerate
   ```

---

## Code Conventions

### TypeScript

**Always use strict typing:**

```typescript
// ✅ Good
interface ExpenseFormData {
  amount: number
  merchant: string
  category: string
}

function handleSubmit(data: ExpenseFormData): Promise<void> {
  // ...
}

// ❌ Bad
function handleSubmit(data: any) {
  // ...
}
```

**Use type inference when obvious:**

```typescript
// ✅ Good (type inferred)
const [isOpen, setIsOpen] = useState(false)

// ❌ Over-typed
const [isOpen, setIsOpen] = useState<boolean>(false)
```

### Naming Conventions

- **Components:** PascalCase (`ExpenseCard`, `QuickExpenseForm`)
- **Files:** kebab-case (`expense-card.tsx`, `quick-expense-form.tsx`)
- **Functions:** camelCase (`handleSubmit`, `formatCurrency`)
- **Constants:** SCREAMING_SNAKE_CASE (`CATEGORY_COLORS`, `API_BASE_URL`)
- **Types:** PascalCase (`Expense`, `FormData`)

### Component Organization

```typescript
// 1. Imports (grouped)
import { useState, useEffect } from 'react'  // React
import { Button } from '@/components/ui/button'  // UI components
import { supabase } from '@/lib/supabase'  // Utils
import type { Expense } from '@/lib/supabase'  // Types

// 2. Types/Interfaces
interface ComponentProps {
  data: Expense[]
}

// 3. Constants
const DEFAULT_LIMIT = 10

// 4. Component
export function Component({ data }: ComponentProps) {
  // 4a. State
  const [state, setState] = useState(null)

  // 4b. Effects
  useEffect(() => {
    // ...
  }, [])

  // 4c. Handlers
  const handleClick = () => {
    // ...
  }

  // 4d. Derived values
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  // 4e. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Async/Await

**Always use try/catch:**

```typescript
// ✅ Good
async function fetchExpenses() {
  try {
    const response = await fetch('/api/expenses')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch expenses:', error)
    toast.error('Failed to load expenses')
    return []
  }
}

// ❌ Bad (no error handling)
async function fetchExpenses() {
  const response = await fetch('/api/expenses')
  return await response.json()
}
```

### Comments

**Use comments for complex logic only:**

```typescript
// ✅ Good (explains non-obvious logic)
// Group expenses by week, starting from Monday
const weeklyGroups = expenses.reduce((groups, expense) => {
  const weekStart = startOfWeek(new Date(expense.transaction_date), { weekStartsOn: 1 })
  const key = format(weekStart, 'yyyy-MM-dd')
  // ...
}, {})

// ❌ Bad (obvious from code)
// Set the amount to the parsed value
const amount = parseFloat(input.value)
```

### Imports

**Use absolute imports with `@/` prefix:**

```typescript
// ✅ Good
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// ❌ Bad
import { Button } from '../../../components/ui/button'
import { supabase } from '../../lib/supabase'
```

---

## Testing Guidelines

**Current Status:** No test framework configured

**Recommended Setup:**

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @vitejs/plugin-react jsdom
```

### Recommended Test Structure

```
__tests__/
├── components/
│   ├── expense-card.test.tsx
│   ├── quick-expense-form.test.tsx
│   └── analytics-charts.test.tsx
├── lib/
│   ├── email-parser.test.ts
│   ├── utils.test.ts
│   └── export.test.ts
└── api/
    ├── expenses.test.ts
    └── email-sync.test.ts
```

### Example Tests

**Component Test:**

```typescript
// __tests__/components/expense-card.test.tsx
import { render, screen } from '@testing-library/react'
import { ExpenseCard } from '@/components/expense-card'

describe('ExpenseCard', () => {
  it('displays expense amount', () => {
    const expense = {
      id: '1',
      amount: 50000,
      merchant: 'Starbucks',
      category: 'Food',
      transaction_date: '2025-11-19T10:00:00Z',
      source: 'manual'
    }

    render(<ExpenseCard expense={expense} />)
    expect(screen.getByText('₫ 50,000')).toBeInTheDocument()
  })
})
```

**Utility Test:**

```typescript
// __tests__/lib/email-parser.test.ts
import { parseVIBEmail } from '@/lib/email-parser'

describe('parseVIBEmail', () => {
  it('parses VIB transaction email correctly', () => {
    const emailBody = `
      Card number: 5138***5758
      Transaction: Payment for services and goods
      Value: 87,000 VND
      At: 01:03 11/17/2025
      At Shopee
    `

    const result = parseVIBEmail(emailBody, 'Transaction notification')

    expect(result.amount).toBe(87000)
    expect(result.merchant).toBe('Shopee')
    expect(result.currency).toBe('VND')
  })
})
```

---

## Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings (auto-detected for Next.js)

3. **Add environment variables:**
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`
   - Ensure Supabase URL and keys are correct

4. **Deploy:**
   - Automatic on push to main branch
   - Manual via Vercel dashboard

### Environment Variables Checklist

**Required:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

**Optional (for email sync):**
- ⚪ `EMAIL_USER`
- ⚪ `EMAIL_PASSWORD`
- ⚪ `EMAIL_HOST`
- ⚪ `EMAIL_PORT`
- ⚪ `EMAIL_TLS`

**Optional (for push notifications):**
- ⚪ `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- ⚪ `VAPID_PRIVATE_KEY`
- ⚪ `VAPID_SUBJECT`

### Pre-Deployment Checklist

- [ ] Run `npm run build` locally (ensure no errors)
- [ ] Test production build: `npm start`
- [ ] Verify environment variables
- [ ] Test database connection
- [ ] Test email sync (if configured)
- [ ] Test on mobile device
- [ ] Verify PWA manifest
- [ ] Check dark mode
- [ ] Test offline functionality

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem:** "Failed to connect to Supabase"

**Solution:**
1. Check `.env` has correct `NEXT_PUBLIC_SUPABASE_URL`
2. Verify anon key is correct
3. Check Supabase project is not paused
4. Ensure RLS policies are set up

#### Email Sync Not Working

**Problem:** "No expenses imported"

**Checklist:**
1. Email credentials correct in `.env`?
2. IMAP enabled in Gmail settings?
3. Using App Password (not regular password)?
4. Email from trusted sender (`info@card.vib.com.vn` or `no-reply@grab.com`)?
5. Check console for parsing errors

**Debug:**
```typescript
// Add logging to lib/email-service.ts
console.log('Fetching from:', process.env.EMAIL_USER)
console.log('Found emails:', emails.length)
console.log('Email from:', email.from[0].address)
```

#### Styles Not Applying

**Problem:** Tailwind classes not working

**Solution:**
1. Restart dev server: `npm run dev`
2. Clear `.next` cache: `rm -rf .next`
3. Check `tailwind.config.ts` content paths
4. Verify `postcss.config.js` exists

#### Dark Mode Issues

**Problem:** Dark mode not working

**Solution:**
1. Check `ThemeProvider` in `app/layout.tsx`
2. Verify `next-themes` is installed
3. Use `dark:` prefix for dark mode styles
4. Check localStorage for theme preference

#### PWA Not Installing

**Problem:** "Install App" banner not showing

**Checklist:**
1. HTTPS required (localhost or deployed)
2. `manifest.json` correctly configured
3. Service Worker registered
4. Icons present in `public/` directory
5. Manifest linked in `app/layout.tsx`

### Debug Mode

**Enable verbose logging:**

```typescript
// Add to app/page.tsx
useEffect(() => {
  console.log('Expenses:', expenses)
  console.log('Filters:', filters)
  console.log('Active View:', activeView)
}, [expenses, filters, activeView])
```

**Check API responses:**

```typescript
const response = await fetch('/api/expenses')
console.log('Status:', response.status)
const data = await response.json()
console.log('Data:', data)
```

### Performance Issues

**Problem:** Slow rendering with many expenses

**Solutions:**
1. Implement pagination (already has `limit` param)
2. Use React.memo for expense cards
3. Virtualize long lists (react-window)
4. Debounce search input

**Example:**

```typescript
import { memo } from 'react'

export const ExpenseCard = memo(function ExpenseCard({ expense }) {
  // Component code
}, (prevProps, nextProps) => {
  return prevProps.expense.id === nextProps.expense.id
})
```

---

## Best Practices for AI Assistants

### When Working with This Codebase

1. **Always read existing code first** before making changes
2. **Follow established patterns** - don't introduce new paradigms
3. **Test on mobile viewport** - this is mobile-first
4. **Maintain type safety** - no `any` types
5. **Support dark mode** - always add `dark:` variants
6. **Use optimistic updates** - for better UX
7. **Keep accessibility** - proper ARIA labels, focus states
8. **Don't break existing features** - test thoroughly

### Questions to Ask Before Implementing

1. Does this fit the mobile-first design philosophy?
2. Is there already a similar component I can reuse?
3. Does this need an API route or can it be client-side?
4. How does this work in dark mode?
5. What happens if the network is slow/offline?
6. Does this need animation for better UX?
7. Is this accessible (keyboard nav, screen readers)?

### Red Flags to Avoid

❌ **Don't:**
- Add new npm packages without justification
- Break the single-page app pattern (no new pages)
- Use inline styles (use Tailwind classes)
- Skip error handling in async functions
- Forget to update TypeScript types
- Ignore mobile viewport testing
- Remove animations/transitions (users expect them)

✅ **Do:**
- Reuse existing components and patterns
- Add proper TypeScript types
- Include error handling and loading states
- Test on mobile viewport
- Support dark mode
- Follow RESTful API conventions
- Add smooth animations with Framer Motion

---

## Additional Resources

### Official Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [Supabase Docs](https://supabase.com/docs)

### Project-Specific Docs

- `README.md` - User-facing documentation
- `UI_IMPROVEMENTS.md` - Recent UI enhancements
- `PWA_SETUP.md` - PWA configuration guide
- `supabase/MIGRATION_GUIDE.md` - Database setup

### Helpful Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm start             # Production server
npm run lint          # Run ESLint

# Testing (if configured)
npm test              # Run tests
npm run test:watch    # Watch mode

# Database
# Run migrations in Supabase SQL Editor

# PWA
npx web-push generate-vapid-keys  # Generate push notification keys

# Deployment
vercel                # Deploy to Vercel
vercel --prod         # Deploy to production
```

---

## Changelog

**2025-11-19:** Initial CLAUDE.md created
- Comprehensive codebase analysis
- Documented architecture and patterns
- Added development workflows
- Included common tasks and troubleshooting

---

## Contributing to This Document

When the codebase changes significantly:

1. Update this document
2. Add entry to Changelog
3. Keep examples up-to-date
4. Notify team of major changes

**This document should be the single source of truth for AI assistants working on this project.**

---

Made with ❤️ for seamless AI-assisted development
