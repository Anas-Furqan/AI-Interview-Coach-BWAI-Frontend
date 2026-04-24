'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/src/context/AuthContext';
import type { UserRole } from '@/src/services/auth';

interface UseRoleOptions {
  roles?: UserRole[];
  redirectTo?: string;
}

export function useRole(options: UseRoleOptions = {}) {
  const { roles = [], redirectTo = '/auth' } = options;
  const router = useRouter();
  const { user, authLoading, role } = useAuthContext();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (roles.length > 0 && role && !roles.includes(role)) {
      router.replace(redirectTo);
    }
  }, [authLoading, role, roles, router, user, redirectTo]);

  const authorized = useMemo(() => {
    if (!user || !role) return false;
    if (roles.length === 0) return true;
    return roles.includes(role);
  }, [user, role, roles]);

  return {
    user,
    authLoading,
    role,
    authorized,
  };
}
