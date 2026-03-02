# Goals Feature - Implementation Plan

## ✅ Completed: Base Architecture

The foundational architecture for the Goals feature has been set up following strict feature-based architecture:

### Directory Structure

```
src/features/goals/
├── types/
│   └── index.ts              ✅ Complete type definitions
├── repository/
│   ├── goals.repository.ts   ✅ Supabase queries for goals
│   ├── milestones.repository.ts ✅ Supabase queries for milestones
│   ├── sessions.repository.ts   ✅ Supabase queries for sessions
│   ├── checkpoints.repository.ts ✅ Supabase queries for checkpoints
│   ├── assessments.repository.ts ✅ Supabase queries for assessments
│   └── reviews.repository.ts     ✅ Supabase queries for reviews
├── apis/
│   ├── goals.api.ts          ✅ Business logic for goals
│   ├── milestones.api.ts     ✅ Business logic for milestones
│   ├── sessions.api.ts       ✅ Business logic for sessions
│   └── checkpoints.api.ts    ✅ Business logic for checkpoints
├── store/
│   ├── goals.store.ts        ✅ Zustand store for goals
│   └── sessions.store.ts     ✅ Zustand store for sessions
├── hooks/
│   ├── useGoals.ts           ✅ React hooks for goals
│   └── useSessions.ts        ✅ React hooks for sessions
├── components/               📁 Ready for components
└── pages/
    └── goals.page.tsx        ⚠️  Has mock data, needs update
```

---

## 🎯 Implementation Phases

### Phase 1: Core Goal Management UI (Priority: HIGH)

#### 1.1 Goals List Page

**File:** `pages/goals-list.page.tsx`
**Purpose:** Main dashboard showing all goals with filtering

**Features:**

- Display goals in card/table layout
- Filter by status (DRAFT, IN_PROGRESS, COMPLETED, etc.)
- Search by title/description
- Show key metrics: progress %, current streak, status badge
- Quick actions: View, Edit (if DRAFT), Start (if APPROVED)
- Empty state for no goals
- Loading skeleton
- Responsive design (mobile-friendly)

**Components Needed:**

- `components/goal-card.tsx` - Individual goal display card
- `components/goals-filters.tsx` - Filter controls
- `components/goal-status-badge.tsx` - Status badge with colors

**Theme Colors:**

```tsx
// Status colors with dark mode support
DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
PENDING_REVIEW: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
IN_PROGRESS: 'bg-[#3DCF8E]/10 dark:bg-[#3DCF8E]/20 text-[#3DCF8E]'
COMPLETED: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
```

---

#### 1.2 Create Goal Flow

**File:** `pages/goal-create.page.tsx`
**Purpose:** Multi-step form to create a new goal

**Steps:**

1. **Basic Info:** Title (required), Description (optional)
2. **Milestones:** Add/edit/reorder milestones
3. **Frequency:** Choose DAILY/WEEKDAYS/WEEKENDS/CUSTOM
4. **Checkpoints (Optional):** Add validation points
5. **Review & Submit:** Preview and submit for review

**Components Needed:**

- `components/goal-form-steps.tsx` - Stepper UI
- `components/goal-basic-form.tsx` - Step 1
- `components/milestone-form.tsx` - Step 2
- `components/frequency-config-form.tsx` - Step 3
- `components/checkpoint-form.tsx` - Step 4
- `components/goal-preview.tsx` - Step 5

**Design Considerations:**

- Use shadcn `Tabs` or custom stepper for multi-step
- Save draft automatically
- Can exit and resume later (always DRAFT)
- Mobile-friendly forms with proper validation
- Use `Calendar` component for date pickers

---

#### 1.3 Goal Detail Page

**File:** `pages/goal-detail.page.tsx`
**Purpose:** View/edit single goal with all details

**Sections:**

- **Header:** Title, status, actions (Edit, Submit, Start, Complete)
- **Overview:** Description, frequency, dates, streak badge
- **Progress:** Visual progress bar, session stats
- **Milestones:** Expandable list with sessions
- **Checkpoints:** Upcoming/completed validations
- **Activity:** Audit trail (goal_reviews)

**Components Needed:**

- `components/goal-header.tsx`
- `components/goal-overview.tsx`
- `components/goal-progress.tsx`
- `components/milestone-list.tsx`
- `components/milestone-item.tsx`
- `components/checkpoint-list.tsx`
- `components/goal-activity-timeline.tsx`

**Role-Based Actions:**

- **DEVELOPER (owner):** Edit (DRAFT), Submit (DRAFT), Start (APPROVED), Complete
- **TEAM_LEAD/ADMIN:** Review goals, Approve/Request Changes

---

### Phase 2: Cadence Sessions & Tracking (Priority: HIGH)

#### 2.1 Today's Sessions Dashboard

**File:** `pages/today-sessions.page.tsx` or integrate into main dashboard
**Purpose:** Quick access to today's scheduled sessions

**Features:**

- List of sessions scheduled for today
- Quick actions: Start, Complete, Skip
- Timer/stopwatch integration (optional)
- Summary input modal for completion
- Real-time streak updates
- Motivational messages

**Components Needed:**

- `components/session-card.tsx` - Individual session card
- `components/session-action-dialog.tsx` - Complete/skip modals
- `components/streak-display.tsx` - Large streak badge
- `components/session-summary-form.tsx`

**Session Card States:**

```tsx
TO_DO: 'border-gray-300 dark:border-gray-700'
IN_PROGRESS: 'border-[#3DCF8E] bg-[#3DCF8E]/5'
COMPLETED: 'border-green-500 bg-green-50 dark:bg-green-900/10'
```

---

#### 2.2 Session Management

**File:** Integrated into goal detail page
**Purpose:** Manage all sessions for a goal

**Features:**

- Calendar view of scheduled sessions
- Manual session creation (before approval)
- Edit session date/time
- View session history
- Filter by status (TO_DO, COMPLETED, MISSED)
- Bulk actions (if needed)

**Components Needed:**

- `components/session-calendar.tsx` - Calendar view using shadcn Calendar
- `components/session-table.tsx` - Table view with pagination
- `components/session-form-dialog.tsx` - Create/edit modal

---

### Phase 3: Checkpoints & Assessments (Priority: MEDIUM)

#### 3.1 Checkpoint Review Interface (For Reviewers)

**File:** `pages/checkpoint-review.page.tsx`
**Purpose:** Team Leads/Admins review developer progress

**Features:**

- List of pending checkpoints assigned to reviewer
- View developer's goal progress
- Review session summaries
- Conduct manual assessment
- Submit pass/fail with feedback
- Add action items if failed

**Components Needed:**

- `components/checkpoint-review-form.tsx`
- `components/assessment-form.tsx`
- `components/action-items-editor.tsx`
- `components/developer-progress-summary.tsx`

**Assessment Form Fields:**

- Passed: Yes/No (required)
- Score: 0-100 (optional)
- Feedback: Textarea
- Strengths: Textarea
- Areas for Improvement: Textarea
- Action Items: Dynamic list (if failed)
- Attachments: File upload (future)

---

#### 3.2 Assessment Results View (For Developers)

**File:** Integrated into goal detail
**Purpose:** View checkpoint results and feedback

**Components Needed:**

- `components/assessment-card.tsx`
- `components/action-items-list.tsx`
- `components/assessment-feedback.tsx`

---

### Phase 4: Review Workflow (Priority: MEDIUM)

#### 4.1 Pending Reviews Dashboard (For Reviewers)

**File:** `pages/pending-reviews.page.tsx`
**Purpose:** List all goals awaiting review

**Features:**

- Filter by developer, date submitted
- Quick preview of goal details
- Approve with one click
- Request changes with comments
- Modify and approve

**Components Needed:**

- `components/goal-review-card.tsx`
- `components/review-action-dialog.tsx`
- `components/review-comments-form.tsx`

**Review Actions:**

```tsx
APPROVED: 'Goal is good, start immediately'
REQUESTED_CHANGES: 'Needs modifications before start'
MODIFIED: 'Made changes and approved'
REJECTED: 'Not suitable, abandon'
```

---

#### 4.2 Review History

**File:** Integrated into goal detail
**Purpose:** Audit trail of all reviews

**Components Needed:**

- `components/review-timeline.tsx`

---

### Phase 5: Advanced Features (Priority: LOW)

#### 5.1 Goals Library (Duplication)

**File:** `pages/goals-library.page.tsx`
**Purpose:** Browse and duplicate successful public goals

**Features:**

- Grid/list of public completed goals
- Filter by category (future: tags)
- Preview goal structure
- One-click duplicate
- Customize before submitting

**Components Needed:**

- `components/library-goal-card.tsx`
- `components/goal-duplicate-preview.tsx`

---

#### 5.2 Goal Templates

**File:** `pages/goal-templates.page.tsx`
**Purpose:** Browse and use pre-made templates

**Features:**

- Browse templates (global + company-specific)
- Create new template (admin only)
- Use template to create goal

**Components Needed:**

- `components/template-card.tsx`
- `components/template-form.tsx`

---

#### 5.3 Analytics & Insights

**File:** `pages/goal-analytics.page.tsx`
**Purpose:** Team-wide metrics and developer performance

**Features:**

- Leaderboard (longest streaks)
- Completion rates
- Average time to billability
- Goal abandonment rate
- Team progress charts

**Components Needed:**

- `components/streak-leaderboard.tsx`
- `components/goal-metrics-chart.tsx` (consider recharts library)
- `components/team-progress-summary.tsx`

---

## 🎨 Design System Guidelines

### Color Usage

```tsx
// Primary Actions
bg-[#3DCF8E] hover:bg-[#3DCF8E]/90

// Backgrounds
bg-[#F8F9FA] dark:bg-[#11181C]

// Cards
bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800

// Success
bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400

// Warning
bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400

// Error
bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400
```

### Spacing

- Use Tailwind's spacing scale: `gap-4`, `p-6`, `mb-4`
- Consistent padding: Cards use `p-6`, Sections use `mb-6`

### Typography

- Headings: `text-3xl font-bold` (h1), `text-2xl font-semibold` (h2)
- Body: `text-base text-gray-700 dark:text-gray-300`
- Muted: `text-sm text-muted-foreground`

### Components

- Use shadcn Button, Card, Dialog, Drawer, Badge, Progress, Table
- Use Skeleton for loading states
- Use Spinner for inline loading
- Use Tabs for multi-section pages

---

## 📋 Additional Components to Create

### Reusable UI Components

1. **`components/streak-badge.tsx`**
   - Display current streak with fire emoji 🔥
   - Celebrate milestones (7 days, 30 days, etc.)

2. **`components/progress-ring.tsx`**
   - Circular progress indicator
   - Show % completion

3. **`components/goal-quick-actions.tsx`**
   - Dropdown of actions based on status
   - Role-aware (show different actions for developers vs reviewers)

4. **`components/empty-state.tsx`**
   - Generic empty state with icon, message, CTA
   - Reusable across all pages

5. **`components/milestone-editor.tsx`**
   - Drag-to-reorder milestones
   - Inline editing
   - Add/remove milestones

6. **`components/loading-skeleton.tsx`**
   - Custom skeletons for goal cards, lists

---

## 🔌 Additional Hooks Needed

1. **`hooks/useGoalActions.ts`**
   - Hook for submit, approve, start, complete actions
   - Handles API calls and state updates

2. **`hooks/useMilestones.ts`**
   - Fetch and manage milestones for a goal

3. **`hooks/useCheckpoints.ts`**
   - Fetch and manage checkpoints

4. **`hooks/useGoalReview.ts`**
   - Handle review workflow

---

## 🚀 Suggested Implementation Order

### Week 1: Core CRUD

1. Update `goals-list.page.tsx` to use real data
2. Create `goal-card.tsx`, `goal-status-badge.tsx`
3. Create `goal-create.page.tsx` (Step 1: Basic form only)
4. Create `goal-detail.page.tsx` (Basic view)

### Week 2: Milestones & Sessions

5. Add milestone editor to create flow
6. Create session UI components
7. Build today's sessions dashboard
8. Implement session actions (start, complete, skip)

### Week 3: Review Workflow

9. Create pending reviews page
10. Build review action dialogs
11. Add review timeline to goal detail

### Week 4: Checkpoints

12. Create checkpoint forms
13. Build assessment interface
14. Display assessments on goal detail

### Week 5: Polish & Advanced

15. Goals library (duplication)
16. Analytics dashboard
17. Mobile responsiveness
18. Performance optimization

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] Repository functions return correct data
- [ ] API functions handle errors properly
- [ ] Store actions update state correctly

### Integration Tests

- [ ] Create → Submit → Approve → Start → Complete flow
- [ ] Checkpoint triggers correctly
- [ ] Session completion updates streak
- [ ] Review workflow creates audit entries

### UI Tests

- [ ] Forms validate inputs
- [ ] Modals open/close correctly
- [ ] Loading states display
- [ ] Dark mode renders correctly
- [ ] Mobile layout works

---

## 📝 Notes for Implementation

### Authentication Context

All API calls need `userId`. Get from auth store:

```tsx
import { useAuthStore } from '@/features/auth/store/auth.store'
const { user } = useAuthStore()
```

### Error Handling

Display errors using shadcn `Sonner` toast:

```tsx
import { toast } from 'sonner'
toast.error('Failed to create goal')
```

### Loading States

Use Suspense boundaries or local loading states:

```tsx
{
  isLoading ? <Skeleton /> : <GoalCard />
}
```

### Form Validation

Use `react-hook-form` + `zod` for forms:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
```

### Date Handling

Use `date-fns` for date formatting:

```tsx
import { format, parseISO } from 'date-fns'
format(parseISO(goal.start_date), 'MMM dd, yyyy')
```

---

## 🔗 Integration Points

### Router Updates

Add routes to `src/app/router.tsx`:

```tsx
{
  path: '/goals',
  element: <GoalsListPage />,
},
{
  path: '/goals/create',
  element: <GoalCreatePage />,
},
{
  path: '/goals/:id',
  element: <GoalDetailPage />,
},
{
  path: '/reviews/pending',
  element: <PendingReviewsPage />,
},
```

### Sidebar Navigation

Update `src/components/app-sidebar.tsx`:

```tsx
{
  title: 'Goals',
  url: '/goals',
  icon: Target,
},
{
  title: 'Reviews',
  url: '/reviews/pending',
  icon: CheckCircle,
  badge: pendingCount, // From API
},
```

---

## 🎯 Success Metrics

After full implementation, the system should:

- ✅ Allow developers to create goals in < 2 minutes
- ✅ Display today's sessions on login
- ✅ Update streaks in real-time
- ✅ Reviewers can approve/reject in < 30 seconds
- ✅ Checkpoint assessments saved with full audit trail
- ✅ Mobile-friendly on all pages
- ✅ Dark mode works everywhere
- ✅ < 3 seconds page load time

---

**Last Updated:** March 1, 2026
**Status:** Base architecture complete, ready for UI implementation
