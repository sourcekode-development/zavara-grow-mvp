Creating an `AGENTS.md` (or `.cursorrules` if you end up using Cursor down the line) is one of the highest-leverage things you can do when working with AI coding assistants. It acts as the ultimate source of truth, preventing the AI from hallucinating standard boilerplate architectures and forcing it to respect your specific migration path.

Here is the markdown content for your `AGENTS.md` file. You can drop this directly into the root of your project.

---

# Zavara Grow - AI Agent Instructions

## 1. Project Overview & Persona

You are an expert Senior Full Stack Developer assisting in building the MVP for "Zavara Grow."
**Product Vision:** A B2B SaaS platform for IT service companies to track, mentor, and validate the upskilling of their developers, turning bench time into billable value.
**Tone & Code Style:** Professional, DRY, strictly typed, and optimized for scalability. Do not write monolithic components.

## 2. Tech Stack

- **Frontend:** React JS (Vite)
- **Language:** TypeScript (Strict Mode)
- **Package Manager:** pnpm
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui + Radix UI primitives
- **State Management:** Zustand
- **BaaS / Database:** Supabase

## 3. Design System & Theming

The application strictly enforces a toggleable Dark/Light mode using Tailwind's `dark` class.

**Color Palette:**

- **Primary Brand:** `#3DCF8E`
- **Background (Light Mode):** `#F8F9FA`
- **Background (Dark Mode):** `#11181C`

_Agent Rule:_ When generating UI components, always ensure Tailwind classes account for both light and dark modes (e.g., `bg-[#F8F9FA] dark:bg-[#11181C]`). Use the primary brand color for primary actions, buttons, and active states.

## 4. Architectural Rules (STRICT)

We use a **Strict Feature-Based (Domain-Driven) Architecture**. Do not group files by their type globally (e.g., do not put all components in `src/components`).

### Base Directory Structure

```text
src/
├── app/                    # Global setup: router, providers, global styles, theme toggle
├── shared/                 # Shared UI (shadcn), global utils, global types, supabase client
└── features/               # Domain-driven modules
    ├── auth/
    ├── kpis/
    ├── goals/
    ├── cadence/
    └── checkpoints/

```

### Feature Module Internal Structure

Every feature inside `src/features/` must follow this exact internal structure:

```text
features/[feature-name]/
├── components/             # Feature-specific UI components
├── pages/                  # Page-level components
├── hooks/                  # Feature-specific custom hooks
├── store/                  # Zustand slices for this feature
├── apis/                   # Boundary layer (consumes repository)
└── repository/             # ONLY direct Supabase client/DB calls

```

### 🚨 Critical Migration Rule: `apis/` vs `repository/`

This MVP is currently using Supabase, but is slated for a migration to **NestJS + PostgreSQL**.

- **`repository/` files:** This is the ONLY place where `supabase.from(...)` or direct database queries should exist. NO business logic goes here.
- **`apis/` files:** This layer calls the `repository/` functions. The rest of the React application (components, hooks, store) MUST ONLY interact with the `apis/` layer, never directly with the `repository/` layer. This ensures that during the backend migration, we only have to swap out the `apis/` layer to use `axios/fetch` and delete the `repository/` folder.

## 5. Coding Conventions

1. **TypeScript:** Everything must be strongly typed. No `any` types. Export interfaces from `src/shared/types/index.ts`.
2. **Components:** Use functional components and arrow functions. Keep components small and focused.
3. **State:** Prefer local state for UI toggles. Use Zustand for feature-level or global state sharing. Do not use Redux.
4. **Imports:** Use absolute imports (e.g., `@/features/auth/...`) if configured, or clean relative paths. Avoid deep relative imports spanning across features.
5. **Cross-Feature Communication:** Features should remain isolated. If `goals/` needs something from `auth/`, it should pull it from global state or a shared utility, avoiding direct deep imports between feature folders.

## 6. Database Schema Awareness

Familiarize yourself with these core domains for typing and mock data:

- **Core:** `companies`, `teams`, `user_profiles` (Roles: COMPANY_ADMIN, TEAM_LEAD, DEVELOPER).
- **Execution:** `goal_templates`, `goals`, `milestones`, `cadence_sessions`.
- **Assessments:** `checkpoints`, `assessments`.
- **Performance/KPIs:** `kpi_categories`, `kpi_templates`, `kpi_template_metrics`, `developer_kpis`, `developer_kpi_metrics`, `kpi_metric_submissions`, `kpi_reviews`.
