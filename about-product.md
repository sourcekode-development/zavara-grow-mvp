# Product Documentation: Zavara Grow

## 1. Product Overview

- **Name:** Zavara Grow
- **Tagline:** Turn bench time into billable value and measure developer impact.
- **Category:** B2B SaaS for IT Service Companies.
- **The Vision:** While traditional ATS platforms bring talent into a company, Zavara Grow takes ownership of the developer's lifecycle post-hire. It provides a unified ecosystem for Tech Leads and Management to run structured UpSkill programs, validate developer growth, and conduct traditional performance appraisals (KPIs), ultimately ensuring developers can be billed to clients at premium rates faster.

## 2. The Problem It Solves

In service-based tech companies, profitability relies on minimizing bench time, upgrading developer skills (e.g., transitioning a single-stack dev to a Full-Stack role), and accurately measuring performance. Currently, this process is broken:

- **Engineering Manager Overload:** Tech leads are consumed by client deliverables. They lack the bandwidth to manually track daily learning streaks, conduct mock interviews, or compile quarterly performance metrics from scratch.
- **The "Black Box" of Upskilling:** Companies invest in generic course subscriptions, but management lacks proof of knowledge retention until a developer fails on a live client project.
- **Disconnected Appraisals:** Traditional HR KPI evaluations are often decoupled from a developer's actual day-to-day technical growth and project execution.
- **Lack of Cadence:** Developers on the bench lack structured accountability, leading to last-minute cramming before an assessment rather than continuous improvement.

## 3. Core Architecture & Workflows (System Logic)

_Note for AI Context: The system utilizes a strict "Blueprint vs. Snapshot" data architecture to preserve historical integrity during evaluations._

### A. The Multi-Tenant Hierarchy

- **Company:** The top-level tenant organization.
- **Teams:** Sub-divisions (e.g., "Frontend Squad", "Cloud Infrastructure").
- **User Profiles:** Acts as a resource map for Management & Sales (tracking skills, domains, certifications, and project allocation status).
- **Roles:**
  - `COMPANY_ADMIN`: Full visibility and template management.
- `TEAM_LEAD`: Reviews UpSkill programs, conducts assessments, and monitors team dashboards.
- `DEVELOPER`: Executes UpSkill modules, logs effort, and submits self-assessments.

### B. Developer-Centric UpSkill Management

**Developers take ownership** of their upskilling journey through structured UpSkill programs:

- **Self-Creation:** Developers can create their own UpSkill programs (e.g., "Become AWS Certified Solutions Architect") or start from reusable company templates.
- **Module-Based Planning:** Each program is broken into modules with descriptions, estimated effort, learning resources, and execution notes.
- **Review Workflow:** Programs are submitted to Team Leads/Admins for approval before formal execution.
- **Reusable Learning Paths:** Strong programs can be promoted into templates or cloned by other developers for peer collaboration.

### C. UpSkill Programs (Core Learning System)

Zavara Grow's learning engine is built around a flexible **UpSkill Program** model designed for evolving learning journeys:

- **Template-Driven or Scratch Built:** Developers can create a program from scratch or clone a reusable company template that already contains modules.
- **Module-Based Planning:** Each program is broken into modules containing title, description, estimated effort, and rich learning content such as links, course references, notes, and internal knowledge.
- **Estimate-Friendly Execution:** Program effort and module effort are estimates, not rigid constraints. Developers can add, edit, rebalance, or mark modules as `WONT_DO` while the program is already in progress.
- **Multi-Reviewer Approval:** Developers submit a program to multiple Team Leads/Admins. The first approval is enough to move the program forward.
- **Effort Logging:** Developers log actual effort against modules over time with notes, creating a real execution trail instead of just a planned structure.
- **Operational Dashboards:** Individual programs and teams surface progress, logged effort, streaks, module completion, and activity frequency in dashboard views for review sessions.

### D. Cadence Tracking & Streak System

UpSkill programs are executed through an honor-system cadence with built-in accountability, driven by flexible "effort" units:

- Developers log progress via **Effort** units. Effort acts like a story point. For one developer, 1 effort = 1 hour; for another, 1 effort = 1 day, depending on the program's context.
- Teams can structure execution around lightweight cadence expectations without forcing rigid planning objects.
- Track progress with effort logs, module status transitions, and overall program completion.
- **Streak Tracking:** The system automatically tracks consecutive active days with a brief grace period to maintain continuity and encourage momentum.
- **Team Visibility:** Dashboards show everyone's progress, creating healthy peer pressure.
- **UpSkill Streaks:** The UpSkill engine tracks both per-program streaks and overall developer streaks using effort logs, with a configurable grace period so a short gap does not instantly reset momentum.

### E. Checkpoints & Validation

To validate knowledge retention (not just task completion):

- Checkpoints triggered at key milestones or after N days of learning.
- Team Leads conduct manual reviews (mock interviews, work assessments).
- Submit detailed assessments: pass/fail, score, feedback, strengths, areas for improvement.
- If failed: Action items and remediation guidance help the developer get back on track.
- **Future:** AI-driven automated interviews for instant validation.

### F. Evidence-Based KPI Appraisals

**KPI Templates:** Performance review blueprints with weighted metrics totaling 100%.

- **Point-Based System:** 1,000 total points distributed across categories (Technical Excellence, Mentorship, etc.).
- **Daily Evidence:** Developers submit proof of work (with the ability to attach screenshots directly as evidence); Team Leads review and award points.
- **Continuous Scoring:** Real-time visibility instead of waiting for quarterly reviews.
- **Snapshotting:** When assigned, KPIs are immutable snapshots preserving historical integrity.

### G. Client and Project Allocation Mapping

To make KPI reviews and survey routing practical in real companies, Zavara Grow now includes a lightweight **client and project allocation layer**.

- **Projects are first-class entities:** Every company can create projects regardless of whether they are service-based or product-based.
- **Clients are optional:** External delivery work can be modeled as `client -> project`, while internal/product work simply uses a project with no client.
- **Many-to-many staffing:** Developers can be assigned to multiple projects, and projects can have multiple members with different responsibilities.
- **Project-Level Responsibility:** Review ownership is modeled at the project membership level, not as a separate global user role.
- **Lead-Owned Delivery Support:** If there is no dedicated project manager, a Team Lead or senior engineer can act as the project's `DELIVERY_OWNER` and also be marked as the primary reviewer.
- **History Matters:** Project assignments are preserved historically using join and leave dates instead of hard deletion. This is important for future KPI reviews, monthly manager surveys, and understanding the delivery context behind a developer's performance.

This gives the platform a better operational picture of:

- who a developer is currently working with
- who owns offshore delivery for that project
- who should receive KPI review requests
- who should receive future project/client feedback surveys

### H. Dynamic Pivots (Smart Recovery)

Failure triggers corrective action, not dead ends:

- Failed checkpoints issue **"Needs Attention"** soft flags.
- System/Reviewer generates targeted **action items** to address gaps.
- Developer must complete remedial work before advancing.
- Focus on continuous improvement rather than penalization.

## 4. Key Value Propositions (USPs)

- **Built for Engineering, Not Just HR:** Actionable tracking of technical skills rather than generic corporate training.
- **Actionable ROI:** Directly ties platform usage to the service company's bottom line (faster bench-to-billing pipeline).
- **Historical Integrity:** The snapshot architecture guarantees compliance and accurate historical appraisals, regardless of how company standards evolve.
- **Operational Context for Reviews:** KPI and growth discussions can be tied back to the developer's actual project and delivery environment rather than being disconnected from project reality.

## 5. Future Scope: AI Agent Integration

Future releases will offload manual Tech Lead tasks to specialized AI Agents.

- **AI Mock Interviewer:** The AI will parse the developer's execution summaries and effort history, contextualize them against the UpSkill program and module structure, and dynamically generate highly specific technical questions to verify their claims via chat or audio.
- **Automated Checkpoints:** Transitioning "Manual Reviews" to AI-driven assessments, providing unbiased, immediate feedback and automatically generating Dynamic Pivot action items based on the AI's technical evaluation.

---
