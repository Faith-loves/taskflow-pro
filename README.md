# TaskFlow Pro

TaskFlow Pro is a full-stack project management SaaS for teams to manage projects, tasks, deadlines, collaboration, and productivity analytics.

## Features

- Supabase Auth entry points for sign up, login, logout, password reset, email verification, profile updates, and avatar uploads
- Workspace system with members, invitations, roles, settings, projects, and permissions
- Project management with dates, status, team assignment, archive workflow, and analytics
- Kanban board with DnD Kit drag-and-drop, custom columns, task creation, renaming, deletion, and status persistence
- Task detail drawer with comments, mentions, subtasks, attachments, and activity history
- Dashboard, calendar, notifications, team members, analytics, settings, search, filters, and 404 state
- Supabase SQL migration with RLS policies, indexes, storage bucket setup, and realtime-ready tables
- Supabase-required app boot so authentication and database access are real

## Tech Stack

React, TypeScript, Tailwind CSS, TanStack Query, DnD Kit, React Hook Form, Zod, Recharts, Supabase Auth, PostgreSQL, Supabase Storage, and Supabase Realtime.

## Local Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.

## Database Setup

Run the SQL in `supabase/migrations/202606040001_initial_schema.sql` inside your Supabase project. It creates the SaaS data model, row-level security policies, storage bucket, indexes, and realtime publication entries.

## AI Assistant

The dashboard robot assistant can use Grok through the Supabase Edge Function in `supabase/functions/ai-assistant`. Set the Supabase secret `XAI_API_KEY` to enable Grok. If the function or key is missing, the app falls back to the built-in free assistant so the project still works.
