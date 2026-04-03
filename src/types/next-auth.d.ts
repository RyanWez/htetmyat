import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'user';
      isBanned?: boolean;
      name_theme?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'admin' | 'user';
    name_theme?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'admin' | 'user';
    id: string;
    isBanned?: boolean;
    lastActiveCheck?: number;
    name_theme?: string | null;
  }
}
