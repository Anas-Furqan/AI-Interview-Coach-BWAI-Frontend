'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Box, Button, Chip, Stack } from '@mui/material';
import { useAuthContext } from '@/src/context/AuthContext';
import { logout } from '@/src/services/auth';

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
  const userLabel = String(user?.displayName || user?.email || 'Signed in');
  const userAvatar = user?.photoURL || '';

  const navItems = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/hiring', label: 'Hiring Intelligence' },
      { href: '/jobs', label: 'Jobs' },
      { href: '/interview', label: 'Interview' },
      { href: '/linkedin-optimizer', label: 'LinkedIn Optimizer' },
      { href: '/recruiter/applications', label: 'Recruiter CTS' },
      { href: '/profile', label: 'Profile' },
    ],
    []
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const dashboardHref = user ? '/dashboard' : '/auth';
  const inProtectedRoute = pathname ? isProtectedRoute(pathname) : false;

  if (inProtectedRoute && !user) {
    return null;
  }

  return (
    <Box className="site-header glass-header" component="header">
      <div className="brand-group">
        <Link href="/" className="brand-link brand-lockup">
          <Image src="/logo192.png" alt="Vetto logo" width={36} height={36} className="brand-mark" />
          <span>Vetto</span>
        </Link>
      </div>

      <Stack className="site-nav" direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>{item.label}</Link>
        ))}

        <Stack direction="row" className="header-actions" alignItems="center">
          {user ? (
            <>
              <Chip
                avatar={<Avatar alt={userLabel} src={userAvatar} />}
                label={userLabel}
                variant="outlined"
                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
              />
              <Chip label={String(role || 'CANDIDATE')} color="primary" variant="outlined" />
              <Button component={Link} href={dashboardHref} size="small" variant="text" className="header-action-btn header-action-ghost">
                Open Dashboard
              </Button>
              <Button size="small" variant="contained" className="header-action-btn header-action-primary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} href="/dashboard" size="small" variant="text" className="header-action-btn header-action-ghost">
                Explore
              </Button>
              <Button component={Link} href="/auth" size="small" variant="contained" className="header-action-btn header-action-primary">
                Sign In
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
