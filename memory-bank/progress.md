# Progress — HMA

## Implementation Phases (from planning.md)

### Phase 1: Foundation ✅ (Mostly Complete)
- [x] Next.js project initialized (v16.2.1 with App Router)
- [x] Supabase setup (client + server configuration)
- [x] Auth.js v5 configured
- [x] Design system CSS (globals.css with CSS variables)
- [x] Layout components (Header, Footer, AdminSidebar)
- [x] Login page
- [ ] Supabase migrations (schema.sql removed from Git — needs migration setup)

### Phase 2: Apple ID System 🔄 (In Progress)
- [x] Admin: Apple ID CRUD UI (form, table, delete)
- [ ] Admin: Server-side CRUD operations (currently uses browser client — broken)
- [x] User: Apple ID listing page
- [ ] User: Apple ID detail with copy-to-clipboard
- [x] Status badges (active/inactive)

### Phase 3: User Management 🔄 (Partially Started)
- [ ] Admin: Create user accounts (UI exists as "Coming Soon")
- [ ] Admin: Ban/Unban users
- [ ] User: Profile page (route exists, status unclear)
- [x] Auth middleware for role protection

### Phase 4: Blog System 📋 (Not Started / Early)
- [ ] Admin: Post editor (rich text)
- [ ] Admin: Post management table
- [ ] User: Blog listing page (route exists)
- [ ] User: Blog detail page
- [ ] Labels/categories

### Phase 5: Polish & Deploy 📋 (Not Started)
- [ ] Report system (route exists, functionality unclear)
- [ ] Settings management (route exists, functionality unclear)
- [ ] SEO (meta tags, OG images)
- [ ] Vercel deployment
- [ ] Mobile testing

## Known Bugs & Issues
| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | 🔴 Critical | Admin CRUD uses browser client → RLS blocks writes | Open |
| 2 | 🔴 Critical | Missing RLS write policies for admin operations | Open |
| 3 | 🔴 Critical | Unsafe type assertions for `role` throughout codebase | Open |
| 4 | 🟡 Important | Dual auth system (Auth.js + Supabase) causing session confusion | Open |
| 5 | 🟡 Important | `profiles` table missing from schema file | Open |
| 6 | 🟡 Important | Missing CSS classes (skeleton, data-table, etc.) | Open |
| 7 | 🟡 Important | Header state collision (menu vs dropdown) | Open |
| 8 | 🟡 Important | ThemeToggle hydration mismatch risk | Open |
| 9 | 🟠 Medium | Dead links in admin sidebar (posts, reports, settings) | Open |
| 10 | 🟠 Medium | All pages client-side only (bad SEO, slow load) | Open |

## Milestones
<!-- TODO: Ask user about target dates -->
| Milestone | Target Date | Status |
|-----------|------------|--------|
| MVP (auth + Apple ID viewing) | TBD | 🔄 In Progress |
| Blog system | TBD | 📋 Not Started |
| Production deployment | TBD | 📋 Not Started |

## Decision Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Complete redesign from Blogger cyberpunk → Next.js professional | Old design outdated, needed modern tech stack |
| 2026-03-23 | Apple-inspired minimalism design direction | Trust and professionalism for account-sharing |
| 2026-03-23 | Next.js + Auth.js + Supabase stack | Modern, full-featured, good DX |
| 2026-03-31 | Removed schema.sql from Git | Security — shouldn't track DB schema in version control |
