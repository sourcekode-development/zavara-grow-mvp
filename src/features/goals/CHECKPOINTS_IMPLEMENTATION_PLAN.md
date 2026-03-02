# Checkpoints & Assessments Feature - Implementation Plan

**Date:** March 1, 2026  
**Status:** Backend ✅ Complete | Frontend 🔨 In Progress

---

## 📋 Current State Analysis

### ✅ What Already Exists

#### Backend Infrastructure

- ✅ **Database Tables:** `checkpoints`, `assessments` (via migrations)
- ✅ **Repository Layer:**
  - `checkpoints.repository.ts` - Full CRUD operations
  - `assessments.repository.ts` - Create, fetch, update assessments
- ✅ **API Layer:**
  - `checkpoints.api.ts` - Complete business logic (227 lines)
  - All checkpoint lifecycle methods (create, review, assess, skip, delete)
- ✅ **Type Definitions:**
  - `Checkpoint`, `Assessment`, `ActionItem` interfaces
  - Status enums: `CheckpointStatus`, `CheckpointType`, `CheckpointTriggerType`

#### Frontend Components

- ✅ **Page:** `checkpoints-list.page.tsx` (203 lines) - Reviewer's view
- ✅ **Component:** `checkpoint-review-form.tsx` (223 lines) - Review UI
- ✅ **Component:** `assessment-form.tsx` (167 lines) - Assessment form
- ✅ **Hook:** `useCheckpoints.ts` - Basic checkpoint operations

#### Router Integration

- ✅ Route exists: `/checkpoints` → `CheckpointsListPage`

---

## 🚧 What's Missing / Needs Implementation

### 1. **Developer Experience - Checkpoint Creation & Management**

**Missing:**

- ❌ UI to create checkpoints when creating/editing goals
- ❌ Checkpoint form integrated in goal creation flow
- ❌ Developer's view of their own checkpoints (My Checkpoints page)
- ❌ Ability to mark checkpoint as "Ready for Review"
- ❌ View assessment results after review

**Impact:** Developers can't create or manage checkpoints, making system one-sided

---

### 2. **Checkpoint Display in Goal Detail Page**

**Missing:**

- ❌ Checkpoints section in `goal-detail.page.tsx`
- ❌ `checkpoint-card.tsx` component for display
- ❌ Status indicators and actions (Mark Ready, View Assessment)

**Impact:** Checkpoints not visible on goal pages

---

### 3. **Assessment Results View (Developer Side)**

**Missing:**

- ❌ `assessment-card.tsx` - Display assessment results
- ❌ `action-items-list.tsx` - Show action items from failed assessments
- ❌ Integration in goal detail or dedicated assessment view page

**Impact:** Developers can't see feedback from reviewers

---

### 4. **Hooks Enhancement**

**Needs Update:**

- ⚠️ `useCheckpoints.ts` - Currently only supports reviewer flow
  - Missing: Developer-specific methods (create, mark ready, view own)
  - Missing: Error handling improvements
  - Missing: Loading states for individual actions

**Impact:** Limited functionality for different user roles

---

### 5. **Store Integration**

**Missing:**

- ❌ Checkpoint-specific Zustand store (optional but recommended)
- ❌ Real-time checkpoint updates in goals store

**Note:** Currently using goals store, but checkpoints might benefit from dedicated store

---

### 6. **UI/UX Polish**

**Missing:**

- ❌ Empty states for no checkpoints
- ❌ Loading skeletons for checkpoint cards
- ❌ Confirmation dialogs for destructive actions
- ❌ Toast notifications for all actions
- ❌ Role-based action visibility (developer vs reviewer)

---

## 🎯 Implementation Phases

### **Phase 1: Developer Checkpoint Management** (Priority: HIGH)

#### 1.1 Create Checkpoint Form Component

**File:** `components/checkpoint-form-dialog.tsx`

**Purpose:** Modal dialog for creating/editing checkpoints

**Features:**

- Title (required)
- Description (optional)
- Type: MANUAL_REVIEW | AI_INTERVIEW (radio group)
- Trigger Type: AFTER_DAYS | AFTER_MILESTONE | MANUAL
- Trigger Config: Days input or milestone selector
- Scheduled Date (optional)
- Assign Reviewer (dropdown of TEAM_LEAD/COMPANY_ADMIN)

**Props Interface:**

```typescript
interface CheckpointFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: CreateCheckpointRequest) => void
  goalId: string
  milestones: Array<{ id: string; title: string }>
  checkpoint?: Checkpoint | null // For editing
  isLoading?: boolean
}
```

**Validation Rules:**

- Title required
- If trigger_type = AFTER_DAYS, trigger_config.after_days required
- If trigger_type = AFTER_MILESTONE, milestone_id required

---

#### 1.2 Checkpoint Editor Component

**File:** `components/checkpoints-editor.tsx`

**Purpose:** Similar to SessionsEditor, manage checkpoints within goal form

**Features:**

- Display list of checkpoints
- Add new checkpoint button
- Edit/Delete checkpoint
- Visual indicators for status
- Drag-to-reorder (future enhancement)

**Props:**

```typescript
interface CheckpointsEditorProps {
  checkpoints: Checkpoint[]
  goalId: string
  milestones: Array<{ id: string; title: string }>
  onAddCheckpoint: (data: CreateCheckpointRequest) => Promise<void>
  onUpdateCheckpoint: (id: string, data: Partial<Checkpoint>) => Promise<void>
  onDeleteCheckpoint: (id: string) => Promise<void>
  isLoading?: boolean
  canEdit?: boolean // Role-based
}
```

---

#### 1.3 Integrate Checkpoint Creation in Goal Flows

**Update Files:**

- `goal-create.page.tsx` - Add Checkpoints tab/step
- `goal-edit.page.tsx` - Add Checkpoints tab

**Implementation:**

```tsx
// In goal-edit.page.tsx, add new tab:
<TabsContent value='checkpoints'>
  <CheckpointsEditor
    checkpoints={goal.checkpoints || []}
    goalId={id!}
    milestones={goal.milestones?.map((m) => ({ id: m.id, title: m.title }))}
    onAddCheckpoint={handleAddCheckpoint}
    onUpdateCheckpoint={handleUpdateCheckpoint}
    onDeleteCheckpoint={handleDeleteCheckpoint}
    isLoading={checkpointLoading}
    canEdit={canEdit}
  />
</TabsContent>
```

**Handler Functions:**

```typescript
const handleAddCheckpoint = async (data: CreateCheckpointRequest) => {
  try {
    await createCheckpoint(data)
    toast.success('Checkpoint added successfully')
    refetch() // Refresh goal data
  } catch (error) {
    toast.error('Failed to add checkpoint')
  }
}
```

---

### **Phase 2: Checkpoint Display & Status Management** (Priority: HIGH)

#### 2.1 Checkpoint Card Component

**File:** `components/checkpoint-card.tsx`

**Purpose:** Display individual checkpoint with actions

**Features:**

- Checkpoint title, description, type
- Status badge with colors
- Trigger info (e.g., "After 7 days" or "After Milestone: AWS Lambda")
- Assigned reviewer badge
- Actions based on status:
  - **PENDING:** Mark Ready for Review (developer)
  - **READY_FOR_REVIEW:** Start Review (reviewer)
  - **PASSED/FAILED:** View Assessment (all)
  - **REVIEW_IN_PROGRESS:** In Progress indicator
- Edit/Delete (developer, only if PENDING)

**Status Colors:**

```typescript
const statusConfig = {
  PENDING: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  READY_FOR_REVIEW: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  REVIEW_IN_PROGRESS: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600',
  NEEDS_ATTENTION: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600',
  PASSED: 'bg-green-100 dark:bg-green-900/20 text-green-600',
  FAILED: 'bg-red-100 dark:bg-red-900/20 text-red-600',
  SKIPPED: 'bg-gray-100 dark:bg-gray-800 text-gray-400',
}
```

---

#### 2.2 Add Checkpoints Section to Goal Detail Page

**Update File:** `goal-detail.page.tsx`

**Add After Milestones Section:**

```tsx
{
  /* Checkpoints Section */
}
{
  goal.checkpoints && goal.checkpoints.length > 0 && (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Checkpoints</h2>
        {canEdit && goal.status === 'DRAFT' && (
          <Button size='sm' onClick={() => setShowCheckpointForm(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Add Checkpoint
          </Button>
        )}
      </div>
      <div className='space-y-3'>
        {goal.checkpoints.map((checkpoint) => (
          <CheckpointCard
            key={checkpoint.id}
            checkpoint={checkpoint}
            onMarkReady={handleMarkCheckpointReady}
            onViewAssessment={handleViewAssessment}
            canEdit={canEdit}
            isOwner={goal.user_id === user?.id}
            isReviewer={checkpoint.assigned_reviewer_id === user?.id}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### **Phase 3: Assessment Results Display** (Priority: MEDIUM)

#### 3.1 Assessment Card Component

**File:** `components/assessment-card.tsx`

**Purpose:** Display assessment results to developer

**Features:**

- Pass/Fail indicator (large, prominent)
- Score (if provided)
- Overall feedback
- Strengths section
- Areas for improvement
- Action items list (if failed)
- Reviewer name and date
- Duration of review

**Layout:**

```
┌─────────────────────────────────────────┐
│ ✅ PASSED  |  Score: 85/100             │
├─────────────────────────────────────────┤
│ Overall Feedback:                       │
│ [Full feedback text]                    │
│                                         │
│ 💪 Strengths:                           │
│ [Strengths text]                        │
│                                         │
│ 📈 Areas for Improvement:               │
│ [Improvements text]                     │
│                                         │
│ Reviewed by: John Doe                   │
│ Date: Feb 28, 2026 • Duration: 15 min  │
└─────────────────────────────────────────┘
```

---

#### 3.2 Action Items List Component

**File:** `components/action-items-list.tsx`

**Purpose:** Display action items from failed assessments

**Features:**

- Numbered list of action items
- Priority badges (HIGH/MEDIUM/LOW)
- Duration estimates
- Resources/links (future)
- Checkmark to track completion (future)

**Example:**

```tsx
<Card>
  <CardHeader>
    <CardTitle className='text-lg flex items-center gap-2'>
      <AlertCircle className='h-5 w-5 text-orange-500' />
      Action Items to Address
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className='space-y-3'>
      {actionItems.map((item, idx) => (
        <div key={idx} className='flex items-start gap-3 p-3 border rounded-lg'>
          <div className='flex items-center justify-center w-6 h-6 rounded-full bg-[#3DCF8E]/10 text-[#3DCF8E] font-semibold text-sm'>
            {idx + 1}
          </div>
          <div className='flex-1'>
            <p className='font-medium'>{item.task}</p>
            {item.duration_minutes && (
              <p className='text-xs text-muted-foreground mt-1'>
                Est. {item.duration_minutes} min
              </p>
            )}
          </div>
          {item.priority && (
            <Badge variant={priorityVariant[item.priority]}>
              {item.priority}
            </Badge>
          )}
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

#### 3.3 Assessment Dialog Component

**File:** `components/assessment-view-dialog.tsx`

**Purpose:** Modal to view full assessment details

**Features:**

- Full-screen modal for comprehensive view
- Uses `AssessmentCard` and `ActionItemsList`
- Close button
- Print/export option (future)

---

### **Phase 4: Developer's My Checkpoints Page** (Priority: MEDIUM)

#### 4.1 Developer Checkpoints Page

**File:** `pages/my-checkpoints.page.tsx`

**Purpose:** Developer's dashboard for all their checkpoints across goals

**Features:**

- Filter by status (PENDING, READY_FOR_REVIEW, PASSED, FAILED)
- Group by goal
- Quick actions: Mark Ready, View Assessment
- Stats: Total checkpoints, Passed, Failed, Pending

**Sections:**

1. **Stats Cards**
   - Pending Checkpoints
   - Awaiting Review
   - Passed
   - Need Attention (Failed)

2. **Checkpoint List** (filterable)
   - Goal title
   - Checkpoint title
   - Status
   - Scheduled date
   - Actions

3. **Empty States**
   - No checkpoints: "Create your first checkpoint in a goal"
   - All passed: "Great job! All checkpoints passed"

---

### **Phase 5: Enhanced Reviewer Experience** (Priority: LOW)

#### 5.1 Improve Checkpoints List Page

**Update File:** `checkpoints-list.page.tsx`

**Enhancements:**

- Add tabs: All | Pending | In Progress | Completed
- Filter by date range
- Search by developer name or goal title
- Export functionality (CSV)
- Bulk actions (future: assign multiple to self)

---

#### 5.2 Developer Progress Summary Component

**File:** `components/developer-progress-summary.tsx`

**Purpose:** Show comprehensive progress for reviewer context

**Features:**

- Goal overview (title, status, duration)
- Milestone progress chart
- Session completion stats
- Streak information
- Previous checkpoints results
- Recent session summaries

**Display in:** Checkpoint review dialog (above assessment form)

---

### **Phase 6: Hooks & Store Updates** (Priority: HIGH)

#### 6.1 Enhanced useCheckpoints Hook

**Update File:** `hooks/useCheckpoints.ts`

**Add Methods:**

```typescript
export const useCheckpoints = () => {
  // Existing...

  // NEW: Developer methods
  const createCheckpoint = async (data: CreateCheckpointRequest) => { ... };
  const markCheckpointReady = async (checkpointId: string) => { ... };
  const deleteCheckpoint = async (checkpointId: string) => { ... };

  // NEW: Reviewer methods
  const startReview = async (checkpointId: string) => { ... };
  const submitAssessment = async (checkpointId: string, data: CreateAssessmentRequest) => { ... };

  // NEW: Shared methods
  const getCheckpointById = async (checkpointId: string) => { ... };
  const getAssessment = async (checkpointId: string) => { ... };

  return {
    // ... existing
    createCheckpoint,
    markCheckpointReady,
    deleteCheckpoint,
    startReview,
    submitAssessment,
    getCheckpointById,
    getAssessment,
  };
};
```

---

#### 6.2 Update Goals Store to Include Checkpoints

**Update File:** `store/goals.store.ts`

**Add:**

```typescript
interface GoalsState {
  // ... existing
  checkpoints: Checkpoint[]

  // Actions
  fetchCheckpoints: (filters?: CheckpointsQueryFilters) => Promise<void>
  addCheckpoint: (checkpoint: Checkpoint) => void
  updateCheckpoint: (id: string, updates: Partial<Checkpoint>) => void
  removeCheckpoint: (id: string) => void
}
```

---

### **Phase 7: Router & Navigation Updates** (Priority: MEDIUM)

#### 7.1 Add New Routes

**Update File:** `app/router.tsx`

**Add:**

```tsx
// Inside goals routes group
<Route path="/goals/checkpoints/my" element={<MyCheckpointsPage />} />
<Route path="/goals/checkpoints/review" element={<CheckpointsListPage />} />
<Route path="/goals/checkpoints/:id" element={<CheckpointDetailPage />} />
```

---

#### 7.2 Update Sidebar Navigation

**Update File:** `components/app-sidebar.tsx`

**Modify Checkpoints menu item:**

```tsx
{
  title: "My Checkpoints",
  url: "/goals/checkpoints/my",
  icon: CheckCircle,
  badge: pendingCheckpointsCount, // From store
}

// If user is TEAM_LEAD or COMPANY_ADMIN, also show:
{
  title: "Review Checkpoints",
  url: "/goals/checkpoints/review",
  icon: ClipboardCheck,
  badge: pendingReviewsCount,
}
```

---

## 📝 Implementation Checklist

### Phase 1: Developer Checkpoint Management

- [ ] Create `checkpoint-form-dialog.tsx`
- [ ] Create `checkpoints-editor.tsx`
- [ ] Update `goal-create.page.tsx` - Add checkpoints tab
- [ ] Update `goal-edit.page.tsx` - Add checkpoints tab
- [ ] Test checkpoint creation flow

### Phase 2: Checkpoint Display

- [ ] Create `checkpoint-card.tsx`
- [ ] Update `goal-detail.page.tsx` - Add checkpoints section
- [ ] Implement "Mark Ready for Review" action
- [ ] Add delete/edit actions
- [ ] Test status transitions

### Phase 3: Assessment Results

- [ ] Create `assessment-card.tsx`
- [ ] Create `action-items-list.tsx`
- [ ] Create `assessment-view-dialog.tsx`
- [ ] Integrate assessment view in checkpoint card
- [ ] Test assessment display

### Phase 4: Developer Checkpoints Page

- [ ] Create `my-checkpoints.page.tsx`
- [ ] Implement filtering and stats
- [ ] Add empty states
- [ ] Test with multiple goals

### Phase 5: Enhanced Reviewer Experience

- [ ] Update `checkpoints-list.page.tsx` with tabs
- [ ] Create `developer-progress-summary.tsx`
- [ ] Add search and filters
- [ ] Test reviewer workflow

### Phase 6: Hooks & Store

- [ ] Enhance `useCheckpoints.ts` with all methods
- [ ] Update `goals.store.ts` for checkpoints
- [ ] Add error handling and loading states
- [ ] Test all hook methods

### Phase 7: Navigation

- [ ] Add routes to `router.tsx`
- [ ] Update `app-sidebar.tsx` with role-based menu
- [ ] Add badge counts
- [ ] Test navigation flow

---

## 🎨 Design Specifications

### Typography

- Page Title: `text-3xl font-bold`
- Section Heading: `text-2xl font-bold`
- Card Title: `text-lg font-semibold`
- Body: `text-base`
- Muted: `text-sm text-muted-foreground`

### Colors (with Dark Mode)

```typescript
// Status badges
PENDING: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
READY_FOR_REVIEW: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
REVIEW_IN_PROGRESS: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
NEEDS_ATTENTION: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
PASSED: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
FAILED: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'

// Primary actions
bg-[#3DCF8E] hover:bg-[#3DCF8E]/90

// Secondary actions
bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
```

### Spacing

- Section gap: `space-y-6`
- Card padding: `p-6`
- Form fields gap: `space-y-4`
- List items gap: `space-y-3`

---

## 🧪 Testing Strategy

### Unit Tests

- [ ] Hook methods return correct data
- [ ] Component props render correctly
- [ ] Form validation works

### Integration Tests

- [ ] Developer creates checkpoint → reviewer reviews → assessment displayed
- [ ] Checkpoint status transitions correctly
- [ ] Action items saved and retrieved
- [ ] Role-based permissions enforced

### E2E Tests

- [ ] Full checkpoint lifecycle
- [ ] Multiple checkpoints per goal
- [ ] Filter and search functionality
- [ ] Mobile responsiveness

---

## 📊 Success Metrics

After implementation, the system should:

- ✅ Developers can create checkpoints in < 1 minute
- ✅ Reviewers can complete assessment in < 5 minutes
- ✅ Assessment results displayed immediately after completion
- ✅ 100% mobile responsive
- ✅ Dark mode works everywhere
- ✅ All actions have proper loading states and error handling

---

## 🚀 Implementation Timeline

**Week 1:** Phases 1 & 2 (Developer checkpoint creation + display)  
**Week 2:** Phase 3 & 4 (Assessment display + My Checkpoints page)  
**Week 3:** Phase 5 & 6 (Enhanced reviewer + Hooks)  
**Week 4:** Phase 7 & Testing (Navigation + E2E tests)

---

**Last Updated:** March 1, 2026  
**Next Review:** After Phase 1 completion
