# 🎨 HMA — Modern Design System

> **Version**: 2.0 — Complete Redesign
> **Last Updated**: 2026-03-23
> **Stack**: Next.js + React + Auth.js + Supabase

---

## 🌟 Design Philosophy

**"Clean, Confident, Premium"** — အဟောင်း Blogger ပုံစံ cyberpunk/neon ကို လုံးဝ ချန်ထားပြီး၊ Apple-inspired minimalism + subtle glassmorphism ကို ပေါင်းစပ်ထားတဲ့ ခေတ်မီ design။

### Core Principles
1. **Clarity** — Content-first, clutter-free
2. **Trust** — Professional feel for account-sharing platform
3. **Accessibility** — Clear hierarchy, readable typography
4. **Responsive** — Mobile-first, works perfectly on all devices

---

## 🎨 Color System

### Light Mode (Default)
```css
--bg-base:        #FAFBFC;        /* Page background */
--bg-surface:     #FFFFFF;        /* Cards, panels */
--bg-elevated:    #F4F6F8;        /* Hover states, secondary surfaces */
--bg-inset:       #EEF1F5;        /* Input backgrounds, code blocks */

--text-primary:   #0F172A;        /* Headings, main text */
--text-secondary: #475569;        /* Body text, descriptions */
--text-tertiary:  #94A3B8;        /* Captions, timestamps */
--text-inverse:   #FFFFFF;        /* Text on colored bg */

--brand-primary:  #2563EB;        /* Primary actions, links */
--brand-hover:    #1D4ED8;        /* Hover state */
--brand-light:    #DBEAFE;        /* Light brand tint */
--brand-gradient: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);

--accent-success: #059669;        /* Success, active status */
--accent-warning: #D97706;        /* Warnings */
--accent-danger:  #DC2626;        /* Errors, delete */
--accent-info:    #0891B2;        /* Info badges */

--border-default: #E2E8F0;
--border-hover:   #CBD5E1;
--shadow-sm:      0 1px 2px rgba(0,0,0,0.05);
--shadow-md:      0 4px 12px rgba(0,0,0,0.08);
--shadow-lg:      0 12px 40px rgba(0,0,0,0.12);
```

### Dark Mode
```css
--bg-base:        #0B1120;
--bg-surface:     #131C2E;
--bg-elevated:    #1A2540;
--bg-inset:       #0D1526;

--text-primary:   #F1F5F9;
--text-secondary: #94A3B8;
--text-tertiary:  #64748B;

--brand-primary:  #3B82F6;
--brand-hover:    #60A5FA;
--brand-light:    rgba(59,130,246,0.15);

--border-default: rgba(255,255,255,0.08);
--border-hover:   rgba(255,255,255,0.15);
--shadow-md:      0 4px 12px rgba(0,0,0,0.3);
```

---

## 📝 Typography

```css
--font-sans:   'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:   'JetBrains Mono', 'Fira Code', monospace;
--font-display: 'Plus Jakarta Sans', var(--font-sans);

/* Scale */
--text-xs:     0.75rem;    /* 12px — Badges, small labels */
--text-sm:     0.875rem;   /* 14px — Captions, metadata */
--text-base:   1rem;       /* 16px — Body text */
--text-lg:     1.125rem;   /* 18px — Lead text */
--text-xl:     1.25rem;    /* 20px — Card titles */
--text-2xl:    1.5rem;     /* 24px — Section heads */
--text-3xl:    1.875rem;   /* 30px — Page titles */
--text-4xl:    2.25rem;    /* 36px — Hero heading */

/* Weights */
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

---

## 📐 Spacing & Layout

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */

--radius-sm:  6px;
--radius-md:  10px;
--radius-lg:  14px;
--radius-xl:  20px;
--radius-full: 9999px;

--content-max: 1200px;
--sidebar-width: 260px;
```

---

## 🧩 Component Design Specs

### 1. GlassCard (Primary Container)

```css
.glass-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.glass-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

/* Dark mode: subtle glass effect */
[data-theme="dark"] .glass-card {
  background: rgba(19, 28, 46, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.06);
}
```

### 2. Apple ID Account Card

```
┌──────────────────────────────────────────┐
│  🍎  appleid_example@icloud.com          │
│                                          │
│  Password    ••••••••••  [👁] [📋Copy]    │
│  Country     🇺🇸 United States            │
│  Status      🟢 Active                   │
│  Expires     Mar 30, 2026                │
│                                          │
│  ┌──────────┐  ┌───────────────────┐     │
│  │ View More│  │ ⚠️ Report Issue   │     │
│  └──────────┘  └───────────────────┘     │
└──────────────────────────────────────────┘
```
- Clean card with monospace email display
- Toggle password visibility
- Copy-to-clipboard button
- Status badge (Active/Expired/Locked)
- Country flag emoji
- Expiry countdown

### 3. Navigation Header

```
┌─────────────────────────────────────────────────────┐
│  ◉ HMA     Home  Apple IDs  Blog  │  🔍  [Avatar] │
└─────────────────────────────────────────────────────┘
```
- Sticky header with subtle blur backdrop
- Clean logo mark + text
- Active page indicator (bottom border or pill bg)
- Search icon → expands into search bar
- User avatar → dropdown (Profile, Settings, Logout)
- Mobile: hamburger → slide-out drawer

### 4. Buttons

```css
/* Primary */
.btn-primary {
  background: var(--brand-primary);
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
}
.btn-primary:hover {
  background: var(--brand-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
}

/* Secondary (outline) */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

/* Gradient (CTA) */
.btn-gradient {
  background: var(--brand-gradient);
  color: white;
}
```

### 5. Status Badges

| Status | Color | Label |
|--------|-------|-------|
| 🟢 Active | `--accent-success` | Available |
| 🟡 In Use | `--accent-warning` | Someone is using |
| 🔴 Expired | `--accent-danger` | Account expired |
| 🔵 New | `--accent-info` | Newly added |

---

## 📱 Page Layouts

### User Pages

#### Homepage (Landing)
```
┌─────────────────────────────────────────────┐
│  [Header / Navigation]                      │
├─────────────────────────────────────────────┤
│                                             │
│  Welcome to HMA                             │
│  Free Apple IDs, Managed & Updated Daily    │
│                                             │
│  [Browse Apple IDs →]   [View Blog →]       │
│                                             │
├─────────────────────────────────────────────┤
│  📊 Stats Bar                               │
│  12 Active IDs  │  340+ Users  │  24/7      │
├─────────────────────────────────────────────┤
│                                             │
│  🍎 Latest Apple IDs                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ ID Card  │ │ ID Card  │ │ ID Card  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  📰 Latest Blog Posts                       │
│  ┌──────────────┐ ┌──────────────┐          │
│  │  Post Card   │ │  Post Card   │          │
│  └──────────────┘ └──────────────┘          │
│                                             │
├─────────────────────────────────────────────┤
│  [Footer]                                   │
└─────────────────────────────────────────────┘
```

#### Apple IDs Listing Page (`/apple-ids`)
```
┌─────────────────────────────────────────────┐
│  [Header]                                   │
├─────────────────────────────────────────────┤
│  Free Apple IDs                             │
│  Filter: [All ▾] [🇺🇸 US] [🇯🇵 JP] [🇬🇧 UK] │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 🍎 user1@icloud.com                  │  │
│  │ 🇺🇸 US │ 🟢 Active │ Expires: 30 Mar │  │
│  │ [View Details] [Copy Password]        │  │
│  ├───────────────────────────────────────┤  │
│  │ 🍎 user2@icloud.com                  │  │
│  │ 🇯🇵 JP │ 🟢 Active │ Expires: 28 Mar │  │
│  │ [View Details] [Copy Password]        │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ⚠️ ဤ Apple ID များကို ဆော့ဖ်ဝဲ download   │
│  ရန်သာ အသုံးပြုပါ။ Password မပြောင်းပါနှင့်  │
└─────────────────────────────────────────────┘
```

#### Login Page (`/login`)
```
┌─────────────────────────────────────────────┐
│                                             │
│          ◉ HMA                              │
│                                             │
│    ┌───────────────────────────────────┐     │
│    │    Welcome Back                  │     │
│    │                                  │     │
│    │  Email                           │     │
│    │  ┌──────────────────────────┐    │     │
│    │  │ email@example.com        │    │     │
│    │  └──────────────────────────┘    │     │
│    │                                  │     │
│    │  Password                        │     │
│    │  ┌──────────────────────────┐    │     │
│    │  │ •••••••••          [👁]  │    │     │
│    │  └──────────────────────────┘    │     │
│    │                                  │     │
│    │  [       Sign In        ]        │     │
│    │                                  │     │
│    │  ─── Or continue with ───        │     │
│    │  [Google]  [Telegram]            │     │
│    └───────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Admin Pages

#### Admin Dashboard (`/admin`)
```
┌───────────┬─────────────────────────────────┐
│           │  Dashboard                      │
│  ◉ HMA   │                                 │
│           │  Quick Stats                    │
│  ─────── │  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  📊 Dash  │  │ 12 │ │ 5  │ │340│ │ 3  │   │
│  🍎 IDs   │  │IDs │ │New │ │Usr│ │Exp │   │
│  📝 Posts │  └────┘ └────┘ └────┘ └────┘   │
│  👥 Users │                                 │
│  ⚙️ Settings│ Recent Activity               │
│           │  • user1@icloud.com viewed      │
│  ─────── │  • New ID added: jp_user@...    │
│  🚪 Logout│  • 2 accounts expire tomorrow  │
│           │                                 │
└───────────┴─────────────────────────────────┘
```

#### Admin — Manage Apple IDs (`/admin/apple-ids`)
```
┌───────────┬─────────────────────────────────┐
│  Sidebar  │  Apple ID Management            │
│           │  [+ Add New ID]  [🔄 Refresh]   │
│           │                                 │
│           │  ┌─ Table ─────────────────────┐│
│           │  │ Email  │Country│Status│Action││
│           │  │────────┼───────┼──────┼──────││
│           │  │user1@..│  🇺🇸  │ 🟢  │[✏️🗑]││
│           │  │user2@..│  🇯🇵  │ 🟡  │[✏️🗑]││
│           │  │user3@..│  🇬🇧  │ 🔴  │[✏️🗑]││
│           │  └────────────────────────────┘ │
│           │                                 │
│           │  Showing 1-10 of 12  [← 1 2 →] │
└───────────┴─────────────────────────────────┘
```

#### Admin — Add/Edit Apple ID Modal
```
┌────────────────────────────────────────┐
│  Add New Apple ID                  [X] │
│                                        │
│  Email *                               │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Password *                            │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Country          Expiry Date          │
│  ┌────────────┐   ┌──────────────┐     │
│  │ 🇺🇸 US  ▾  │   │ 2026-03-30   │     │
│  └────────────┘   └──────────────┘     │
│                                        │
│  Notes (optional)                      │
│  ┌──────────────────────────────────┐  │
│  │ e.g. Don't change password      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Status: [● Active] [○ Inactive]       │
│                                        │
│  [Cancel]              [Save Apple ID] │
└────────────────────────────────────────┘
```

---

## 🎭 Motion & Interaction

```css
/* Transitions */
--transition-fast:   0.15s ease;
--transition-base:   0.2s ease;
--transition-slow:   0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Page transitions: Framer Motion */
/* fadeUp on page enter */
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: "easeOut" }}

/* Card hover: subtle lift */
/* Button press: scale(0.98) */
/* Modal: fade + scale from 0.95 */
/* Skeleton loading: shimmer animation */
```

### Loading States
- **Skeleton loaders** for cards (not spinners)
- **Shimmer effect** on content placeholders
- **Optimistic UI** for actions (copy, toggle)

---

## 📱 Responsive Breakpoints

```css
--bp-sm:   640px;    /* Mobile landscape */
--bp-md:   768px;    /* Tablet */
--bp-lg:   1024px;   /* Desktop */
--bp-xl:   1280px;   /* Wide desktop */
```

| Breakpoint | Layout |
|------------|--------|
| < 640px | Single column, bottom nav, stacked cards |
| 640-1024px | Two column grid, sidebar collapses to drawer |
| > 1024px | Full layout with sidebar (admin only) |

---

## 🔑 Key Design Decisions

1. **No neon/cyberpunk** — Original ပုံစံမှ လုံးဝ ကွဲထွက်ပြီး professional look
2. **Light mode default** — Dark mode as toggle option
3. **Apple-inspired cards** — Clean rounded corners, subtle shadows
4. **Blue primary** — Trust, professionalism (not green/cyan neon)
5. **Content hierarchy** — Clear section headings, consistent spacing
6. **Admin sidebar** — Persistent sidebar navigation (desktop), responsive drawer (mobile)
7. **User layout** — Clean top-nav layout without sidebar clutter
