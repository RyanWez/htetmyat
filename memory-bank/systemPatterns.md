# System Patterns — HMA

## Architecture Pattern
- **Next.js App Router** with route groups: `(user)` for public pages, `admin/` for admin pages
- **Server Components** as default, `'use client'` only when needed (though many pages are currently client-only — known issue)
- **Server Actions** in `src/app/actions/` and `src/app/admin/actions.ts` for mutations

## Authentication Pattern
- **Auth.js v5 (NextAuth)** handles session management via JWT cookies
- **Supabase Auth** used alongside for database-level auth (dual auth — known issue)
- **Middleware** (`middleware.ts`) protects routes:
  - Unauthenticated → redirect to `/login`
  - Authenticated at `/login` → redirect to `/`
  - Non-admin at `/admin/*` → redirect to `/`
- **Role checking** via unsafe type assertion: `(session?.user as { role?: string })?.role === 'admin'`

## Data Access Patterns
- **Browser client**: `createClient()` from `@supabase/ssr` — used in client components
- **Server client**: Server-side Supabase client for SSR data fetching
- **Admin operations**: Currently using browser client (known security issue — should use server actions with service_role_key)

## Design System
- **CSS Variables** defined in `globals.css` for colors, spacing, typography, shadows
- **CSS Modules** for component-level styles (`.module.css` files)
- **Light/Dark Mode** via `data-theme` attribute on root element
- **Design philosophy**: "Clean, Confident, Premium" — Apple-inspired minimalism + subtle glassmorphism
- **Fonts**: Inter (sans), JetBrains Mono (mono), Plus Jakarta Sans (display)
- **Color**: Blue primary (#2563EB), professional palette — no neon/cyberpunk

## Component Patterns
- **GlassCard**: Primary container with hover effects (lift + shadow)
- **Layout components**: `Header.tsx` (user nav), `AdminSidebar.tsx` (admin nav), `Footer.tsx`
- **AccountGuard.tsx**: Client-side auth guard
- **Providers.tsx**: React context providers wrapper
- **Framer Motion**: Page transitions with fadeUp animation

## Known Architectural Issues (from code_analysis.md)
1. **Dual Auth**: Auth.js + Supabase Auth running in parallel — RLS policies tied to Supabase auth, sessions from Auth.js
2. **Client-side data fetching**: Many pages use `useEffect` instead of server components
3. **Missing RLS write policies**: Only SELECT policies exist; INSERT/UPDATE/DELETE missing
4. **Admin CRUD via browser client**: Should use server actions with service_role_key
5. **Type safety**: `role` property not properly typed in Auth.js session (uses unsafe assertions)
6. **Missing CSS classes**: `skeleton`, `data-table`, `select-field`, `textarea-field` referenced but undefined
7. **Header state collision**: Single state for both dropdown menu and mobile hamburger
8. **Dead links**: Several admin sidebar links point to non-existent routes

## File Naming Conventions
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx`
- Client components: sometimes split as `*-client.tsx` (e.g., `home-client.tsx`)
- CSS Modules: `*.module.css`
- Server actions: `actions.ts`
- Types: in `src/types/` directory or inline

## Error Handling
<!-- TODO: Ask user about error handling strategy -->
- Currently minimal — needs improvement

## Testing
<!-- TODO: Ask user about testing strategy -->
- No test files observed in the project
