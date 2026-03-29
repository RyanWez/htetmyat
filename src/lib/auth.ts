import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';


// Check interval for is_active status (30 seconds)
const ACTIVE_CHECK_INTERVAL_MS = 30 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use a direct Supabase client (not cookie-based) for auth
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          // Detect Supabase ban error (user_banned)
          if (error) {
            if (error.message?.toLowerCase().includes('banned')) {
              // Throw a specific error so we can detect it upstream
              throw new Error('ACCOUNT_SUSPENDED');
            }
            return null;
          }

          if (!data.user) {
            return null;
          }

          // Double-check: verify profile is_active status
          const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const { data: profile } = await serviceClient
            .from('profiles')
            .select('is_active')
            .eq('id', data.user.id)
            .single();

          if (profile && profile.is_active === false) {
            throw new Error('ACCOUNT_SUSPENDED');
          }

          // Determine role: check env ADMIN_EMAIL first, then user metadata
          const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
          const userEmail = (data.user.email || '').toLowerCase();
          const role = adminEmails.includes(userEmail)
            ? 'admin'
            : (data.user.user_metadata?.role || 'user');

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.display_name || data.user.email,
            role: role,
            image: data.user.user_metadata?.avatar_url || null,
          };
        } catch (err) {
          // Re-throw ACCOUNT_SUSPENDED so NextAuth propagates it
          if (err instanceof Error && err.message === 'ACCOUNT_SUSPENDED') {
            throw err;
          }
          console.error('Auth error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isBanned = false;
        token.lastActiveCheck = Date.now();
      }

      // Periodic check: verify the user is still active in the database
      if (token.id && !user) {
        const now = Date.now();
        const lastCheck = (token.lastActiveCheck as number) || 0;

        if (now - lastCheck > ACTIVE_CHECK_INTERVAL_MS) {
          try {
            const serviceClient = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const { data: profile } = await serviceClient
              .from('profiles')
              .select('is_active, avatar_url')
              .eq('id', token.id)
              .single();

            if (profile) {
              token.isBanned = !profile.is_active;
              token.picture = profile.avatar_url; // Update picture in token
            }
          } catch {
            // On error, don't change ban status to avoid false positives
          }
          token.lastActiveCheck = now;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user';
        session.user.isBanned = token.isBanned as boolean;
        session.user.image = (token.picture as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

