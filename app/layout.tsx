import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'AI Interview Coach',
  description: 'Premium AI interview practice with live speech intelligence HUD.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="dark">
        <Providers>
          <div className="page-shell">
            <div className="page-orb page-orb-a" />
            <div className="page-orb page-orb-b" />
            <div className="page-orb page-orb-c" />

            <SiteHeader />

            <main className="app-main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
