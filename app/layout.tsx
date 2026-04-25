import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import SiteHeader from '@/components/SiteHeader';
import ChatbotWidget from '@/components/ChatbotWidget';
import SmoothLoader from '../components/theme/SmoothLoader';
import UiMotionEffects from '../components/theme/UiMotionEffects';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Interview Coach',
  description: 'Premium AI interview practice with live speech intelligence HUD.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className={`${plusJakarta.variable} font-body dark`}>
        <Providers>
          <SmoothLoader />
          <UiMotionEffects />
          <div className="page-shell">
            <div className="page-orb page-orb-a" />
            <div className="page-orb page-orb-b" />
            <div className="page-orb page-orb-c" />

            <SiteHeader />

            <main className="app-main page-enter">{children}</main>
            <ChatbotWidget />
          </div>
        </Providers>
      </body>
    </html>
  );
}
