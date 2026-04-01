# Professional In-App Notification System (Architecture & Implementation)

## Overview
A robust, real-time in-app notification system was implemented to run alongside the existing Web / ServiceWorker Push Notifications. It is specifically designed to conserve Supabase Database Row limits by utilizing a "Global Broadcast" vs "Personal" relation strategy.

### 1. Database Schema
Created via direct SQL execution. The system avoids row-duplication for global announcements.

*   `public.notifications`
    *   `id` (uuid, PK), `title` (text), `message` (text), `link` (text, nullable), `type` (text - 'global' or 'personal'), `user_id` (uuid, nullable constraint), `created_at` (timestamptz).
*   `public.user_noti_reads`
    *   Tracks which user has read which global/personal notification.
    *   `user_id` (uuid, composite PK), `notification_id` (uuid, composite PK, CASCADE delete), `read_at` (timestamptz).
*   `public.notification_templates`
    *   Dynamic templates editable from the Admin UI. Currently includes `apple_id_active`. Allows `{{title}}` or `{{email}}` variable injection.

### 2. Security (RLS)
*   **Notifications**: `SELECT` is unrestricted for global (`type = 'global'`), and locked to `user_id = auth.uid()` for personal. Insert/Update restricted to Service Role (Admin).
*   **User Reads**: Users can only `INSERT` and `SELECT` their own `user_id`.

### 3. Server Actions & Backend
*   **`src/components/layout/notification-actions.ts`**
    *   `getMyNotifications(limit, offset)`: Uses Supabase `createServiceClient` to find `type=global` or `user_id=me`, then filters against `user_noti_reads`. Returns paginated data and a `hasMore` edge boolean.
    *   `markNotificationAsRead(id)`: Safely inserts the user-read link while gracefully bypassing `23505` unique constraint errors.
*   **`/admin/apple-ids/actions.ts`**
    *   Intercepts the Apple ID account active toggle. If flipped to "Active", parses the `apple_id_active` Notification Template and automatically inserts a `global` row using the new Apple ID details.

### 4. Admin UI
*   **`/admin/notifications/page.tsx`**
    *   "Notifications" tab added to AdminSidebar.
    *   **Manual Tab**: Form to instantly trigger custom Text/Link notifications (with an optional checkbox to also throw a Web Push payload).
    *   **Templates Tab**: Real-time editor to update the text structure that fires automatically elsewhere.

### 5. Frontend UI / `NotificationCenter.tsx`
*   Integrated into `src/components/layout/Header.tsx` just before the user Profile dropdown.
*   **Real-Time & Fallbacks:** NextAuth sessions don't perfectly interface with Supabase Auth WebSocket cookies out-of-the-box. We used a triple-layer strategy for instant delivery:
    1.  **WebSocket (`supabase.channel`)**: Subscribes to `INSERT` on `notifications`. Triggers `fetchNotis()` and a Toast.
    2.  **Focus Reload**: `window.addEventListener('focus')`.
    3.  **Polling**: Fallback 15-second `setInterval` to prevent missed packets over proxies.
*   **Design Characteristics:**
    *   Glassmorphic UI defined in `NotificationCenter.module.css`.
    *   `backdrop-filter: blur(24px)` dropped in favor of a **Solid Elevated Background** `var(--bg-surface-solid)` with thick drop shadows (`box-shadow: 0 10px 40px ...`) due to low contrast clashes on light modes.
    *   Mobile view explicitly handles bounds correctly utilizing `position: absolute; right: 0; max-width: calc(100vw - 32px);`.
    *   The "New" Dot utilizes Apple Red (`var(--accent-danger)`) and item indicator utilized Bright Blue (`var(--accent-info)`).
*   **Pagination:** Implemented a "Load More" button passing cursor offsets rather than rendering 100+ notifications simultaneously, thereby saving Dom layout performance.

### Future Context 
*   **Do not use `position: fixed`** on dropdowns inside `.container` or `Header.tsx` because ancestral classes applying backdrop filters/transforms will incorrectly trap the Fixed context box constraints.
*   NextAuth state `status === 'authenticated'` is relied upon to prevent rendering the socket overhead for guests. Do not remove this check.
