'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole | UserRole[];
  requireKYC?: boolean;
}

export function ProtectedRoute({
  children,
  requireRole,
  requireKYC = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // User is banned - redirect to banned page
      if (user?.is_banned) {
        router.push('/banned');
        return;
      }

      // Check role requirement
      if (requireRole) {
        const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
        if (!roles.includes(user!.role)) {
          router.push('/');
          return;
        }
      }

      // Check KYC requirement (only for sellers)
      if (requireKYC && user?.role === 'seller') {
        if (user.kyc_status !== 'APPROVED') {
          router.push('/seller/kyc');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requireRole, requireKYC, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or doesn't meet requirements
  if (!isAuthenticated || (requireRole && user && !Array.isArray(requireRole) && user.role !== requireRole)) {
    return null;
  }

  // Render children
  return <>{children}</>;
}
