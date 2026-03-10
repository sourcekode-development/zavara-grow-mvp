# Streak System (Goals + Cadence Sessions + Effort)

## Overview
The streak system tracks consistent activity based on **daily completed effort**.

A streak increments when `cadence_sessions.completed_effort` **increases on a new day** for a goal.

Only **one streak increment per day per goal** is allowed.

A **2-day grace period** is supported before streak break.

---

## Core Rule
A streak increases when:

```text
session.completed_effort increases on a new day
```

Implications:
- If effort increases today, streak can increase.
- If effort increases multiple times the same day, streak increases only once.
- If effort does not increase for more than 2 days, streak breaks.

---

## Database Fields (goals)

### `current_streak`
- Type: `integer`
- Meaning: current active streak count

### `longest_streak`
- Type: `integer`
- Meaning: max streak achieved

### `last_effort_date`
- Type: `date`
- Meaning: last day where streak-eligible effort increase happened

---

## When Streak Logic Runs
Run streak logic when:

```text
CadenceSession.completed_effort increases
```

Typical triggers:
- session progress edit where `completed_effort` increases
- session update workflows that increase completed effort

Do **not** run streak logic when:
- session is created without effort increase event
- session edited with no increase in completed effort
- session edited with equal/decreased completed effort

---

## Streak Calculation
On streak-eligible effort increase:

1. Get `today`.
2. Read goal `last_effort_date`.
3. Compute:

```text
days_difference = today - last_effort_date
```

### Case 1: Same day
If:

```text
days_difference == 0
```

Do nothing (already counted today).

### Case 2: Within grace window
If:

```text
days_difference <= 3
```

Then:

```text
current_streak += 1
last_effort_date = today
```

Interpretation:
- gap 1 day: normal continuation
- gap 2 days: grace
- gap 3 days: still allowed (2-day grace window)

### Case 3: Break streak
If:

```text
days_difference > 3
```

Then:

```text
current_streak = 1
last_effort_date = today
```

---

## Longest Streak
After current streak update:

```text
longest_streak = max(longest_streak, current_streak)
```

---

## Example

| Day | Effort Completed | Result |
| --- | ---------------- | ------ |
| Day 1 | Yes | streak = 1 |
| Day 2 | No | streak still 1 |
| Day 3 | No | streak still 1 |
| Day 4 | Yes | streak = 2 |
| Day 5 | Yes | streak = 3 |
| Day 6 | No | still 3 |
| Day 7 | No | still 3 |
| Day 8 | No | streak reset |

---

## Integration with CadenceSession
Relevant fields:

```text
cadence_sessions.session_effort
cadence_sessions.completed_effort
cadence_sessions.status
```

When `completed_effort` increases:
1. goal progress (`goals.completed_effort`) is synchronized.
2. streak calculation runs (once per day per goal).

---

## Important Rules
1. One streak increment per day per goal.
2. Streak increments only on `completed_effort` increase.
3. Editing without increase does not affect streak.
4. Duplicate increments on same day are prevented.

---

## Edge Cases
- Multiple effort updates in one day: only first increment counts.
- Editing previously completed sessions: only positive increase triggers streak logic.
- Multiple sessions for same goal in one day: still only one streak increment for that goal/day.
- Timezone differences: logic uses DB `current_date`; keep app/database timezone policy consistent.

---

## Implementation Notes
- Streak updates should be **atomic** at DB level.
- Use goal row locking or DB function-based update to avoid race conditions.
- Trigger streak logic only from completed-effort increase path.

---

## UI Suggestion
Display on goal surfaces:

```text
🔥 Current Streak: X days
🏆 Longest Streak: Y days
```

---

## Verification Checklist
- Streak increments once/day when completed effort increases.
- 2-day grace behavior works (`days_difference <= 3`).
- Break works after gap `> 3`.
- Longest streak updates correctly.
- No duplicate same-day increments.
