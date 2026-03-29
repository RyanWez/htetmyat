import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import ActivityTracker from '@/components/ActivityTracker';

export const metadata: Metadata = {
  title: 'HMA — Free Apple IDs',
  description: 'Free Apple IDs, Managed & Updated Daily. Download your favorite iOS apps with shared Apple accounts.',
  keywords: ['Apple ID', 'free', 'iOS', 'apps', 'download'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('hma-theme');
                  var preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = stored || preferred;
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <ActivityTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
