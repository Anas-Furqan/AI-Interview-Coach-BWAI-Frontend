'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useAuthContext } from '@/src/context/AuthContext';
import { logout } from '@/src/services/auth';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const PUBLIC_ROUTES = ['/', '/auth', '/report/demo'];
const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/interview', '/jobs', '/report', '/profile', '/admin', '/recruiter'];

function isProtectedRoute(pathname: string) {
  if (pathname === '/report/demo') {
    return false;
  }

  return PROTECTED_ROUTE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuthContext();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const userLabel = String(user?.displayName || user?.email || 'Signed in');
  const userAvatar = user?.photoURL || '';

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const publicNavItems = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/auth', label: 'Get Started' },
    ],
    []
  );

  const privateNavItems = useMemo(
    () => [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/jobs', label: 'Jobs' },
      { href: '/report/demo', label: 'Report' },
    ],
    []
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleInstallApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  if (pathname && isProtectedRoute(pathname) && !user) {
    return (
      <Box className="site-header glass-header" component="header">
        <Link href="/" className="brand-link brand-lockup">
          <span className="brand-mark" />
          <span>AI Interview Coach</span>
        </Link>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" justifyContent="flex-end" sx={{ ml: 'auto' }}>
          <Button component={Link} href="/auth" size="small" variant="contained">
            Get Started
          </Button>
          {!isInstalled ? (
            <Button size="small" variant="outlined" onClick={handleInstallApp} disabled={!installPrompt}>
              Install App
            </Button>
          ) : null}
          <Button component={Link} href="/auth" size="small" variant="outlined">
            Login
          </Button>
        </Stack>
      </Box>
    );
  }

  if (pathname && isProtectedRoute(pathname)) {

    return (
      <Box className="site-header glass-header authenticated-shell" component="header">
        <Link href="/" className="brand-link brand-lockup">
          <span className="brand-mark" />
          <span>AI Interview Coach</span>
        </Link>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" justifyContent="flex-end" sx={{ ml: 'auto' }}>
          <Chip
            avatar={<Avatar alt={userLabel} src={userAvatar} />}
            label={userLabel}
            variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
          />
          <Chip label={String(role || 'CANDIDATE')} color="primary" variant="outlined" />
          <Button component={Link} href="/profile" size="small" variant="outlined">Profile</Button>
          <Button component={Link} href="/dashboard" size="small" variant="outlined">Dashboard</Button>
          <Button size="small" variant="contained" onClick={handleLogout}>Logout</Button>
        </Stack>
      </Box>
    );
  }

  const dashboardHref = user ? '/dashboard' : '/auth';

  return (
    <Box className="site-header glass-header" component="header">
      <div className="brand-group">
        <Link href="/" className="brand-link brand-lockup">
          <span className="brand-mark" />
          <span>AI Interview Coach</span>
        </Link>
      </div>

      <Stack className="site-nav" direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        {privateNavItems.map(item => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}

        {user ? (
          <Button component={Link} href={dashboardHref} size="small" variant="contained" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
            Open Dashboard
          </Button>
        ) : (
          <>
            <Button component={Link} href="/auth" size="small" variant="contained" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
              Login
            </Button>
            <Button size="small" variant="outlined" onClick={handleInstallApp} disabled={!installPrompt} sx={{ whiteSpace: 'nowrap' }}>
              Install App
            </Button>
          </>
        )}

        {user && !isInstalled ? (
          <Button size="small" variant="contained" onClick={handleInstallApp} disabled={!installPrompt} sx={{ ml: 1, whiteSpace: 'nowrap' }}>
            Install App
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
