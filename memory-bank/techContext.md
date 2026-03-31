# Tech Context — HMA

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 16.2.1 | SSR, routing, API routes |
| **UI** | React | 19.2.4 | Component-based UI |
| **Auth** | Auth.js (NextAuth) | v5 beta.30 | Login, session, role-based access |
| **Database** | Supabase (PostgreSQL) | — | All data storage |
| **Supabase Client** | @supabase/ssr + @supabase/supabase-js | 0.9.0 / 2.100.0 | DB access from server and client |
| **Styling** | CSS Modules + CSS Variables | — | Design system, component styles |
| **Animation** | Framer Motion | 12.38.0 | Page transitions, micro-animations |
| **Charts** | Recharts | 3.8.1 | Admin dashboard analytics |
| **PWA** | @ducanh2912/next-pwa | 10.2.9 | Progressive Web App support |
| **Push Notifications** | web-push | 3.6.7 | Server-side push notifications |
| **Image Processing** | Sharp | 0.34.5 | Image optimization |
| **Language** | TypeScript | 5.x | Type safety |
| **Linting** | ESLint | 9.x | Code quality |
| **Deployment** | Vercel | — | Hosting |

## Project Structure
```
htetmyat/
├── src/
│   ├── app/
│   │   ├── (user)/          # User-facing route group
│   │   │   ├── apple-ids/   # Apple ID listing & detail
│   │   │   ├── blog/        # Blog listing & detail
│   │   │   ├── page.tsx     # Homepage (server) → home-client.tsx (client)
│   │   │   └── layout.tsx   # User layout (Header + Footer)
│   │   ├── admin/           # Admin routes (requires admin role)
│   │   │   ├── apple-ids/   # Apple ID CRUD
│   │   │   ├── posts/       # Blog post management
│   │   │   ├── users/       # User management
│   │   │   ├── reports/     # Issue reports
│   │   │   ├── settings/    # Site settings
│   │   │   └── page.tsx     # Admin dashboard
│   │   ├── login/           # Login page
│   │   ├── profile/         # User profile
│   │   ├── actions/         # Server actions
│   │   ├── api/             # API routes (auth, etc.)
│   │   ├── globals.css      # Design system tokens + global styles
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── admin/           # Admin-specific components
│   │   ├── layout/          # Header, AdminSidebar, Footer, etc.
│   │   ├── ui/              # Reusable UI components
│   │   ├── AccountGuard.tsx # Auth guard component
│   │   ├── Providers.tsx    # Context providers
│   │   └── AppleIcon.tsx    # Apple icon component
│   ├── lib/
│   │   ├── supabase/        # Supabase client (client.ts, server.ts, types.ts)
│   │   ├── auth.ts          # Auth.js configuration
│   │   ├── logger.ts        # Logging utility
│   │   └── utils.ts         # Helper functions
│   ├── types/               # TypeScript type definitions
│   └── proxy.ts             # Proxy utility
├── worker/
│   └── index.ts             # Service worker / background worker
├── public/                  # Static assets
├── next.config.mjs          # Next.js config (PWA, images, server actions)
├── next.config.ts           # Alternate Next.js config
└── package.json
```

## Database (Supabase)
- **Project ID**: ufigkviwylrrpfxdmvmw (from image remote patterns)
- **Tables**: `apple_ids`, `profiles`, `posts`, `labels`, `post_labels`, `apple_id_reports`, `settings`
- **Auth**: Dual system — Auth.js (NextAuth v5) for sessions + Supabase Auth for DB operations
- **RLS**: Enabled on `apple_ids` and `profiles` (but with known gaps — see systemPatterns.md)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_URL
NEXTAUTH_SECRET / AUTH_SECRET
ADMIN_EMAIL
```

## Build & Dev Commands
```bash
npm run dev      # Start dev server (uses --webpack flag)
npm run build    # Production build (uses --webpack flag)
npm run start    # Start production server
npm run lint     # ESLint
```

## Key Dependencies Notes
- Using `--webpack` flag for dev/build (not Turbopack)
- PWA disabled in development mode
- Server actions body size limit: 10mb
- Image optimization configured for Supabase storage
- `web-push` marked as serverExternalPackage
