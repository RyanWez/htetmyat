# Active Context — HMA

## Current State (2026-03-31)

### What's Working
- Next.js 16 project bootstrapped and running
- Basic project structure with App Router (route groups, layouts)
- Design system (CSS variables, globals.css — 17,954 bytes of styles)
- Login page exists
- User-facing pages: Homepage, Apple IDs listing, Blog section
- Admin pages: Dashboard, Apple ID management, Users (Coming Soon placeholder)
- Auth.js v5 configured with Supabase credentials provider
- Supabase client setup (browser + server)
- Framer Motion for animations
- PWA configuration
- Push notification setup (web-push)
- Header, AdminSidebar, Footer components
- Dark/Light theme toggle

### What's In Progress
<!-- TODO: Confirm with user -->
- Admin CRUD operations (have UI, but security issues with data access)
- Blog post system (routes exist under admin/posts)
- User management
- Reports system
- Settings management

### What's Not Started / Broken
- Several admin routes are stubs or non-functional (posts, reports, settings)
- Profile page linked but may be incomplete
- RLS write policies missing (admin operations may silently fail)
- Push notification flow (worker exists but unclear if fully wired)
- Testing infrastructure
- SEO optimization
- Production deployment

## Recent Changes
- 2026-03-31: Removed `schema.sql` from Git and added to `.gitignore`
- 2026-03-25: Code analysis report created identifying critical issues
- 2026-03-23: Initial planning and design system documentation created

## Current Focus
<!-- TODO: Ask user what they're currently working on -->

## Upcoming Priorities
<!-- TODO: Confirm with user -->
Based on planning.md priority list:
1. Fix security issues (server actions for admin CRUD, RLS policies)
2. Complete auth system (resolve dual auth, type safety)
3. Complete Apple ID management flow
4. Blog system
5. User management
6. Polish and deploy
