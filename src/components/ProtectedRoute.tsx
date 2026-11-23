import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type ResolvedPortalRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: ResolvedPortalRole[];
  redirectTo: string;
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, redirectTo, children }: ProtectedRouteProps) {
  const { loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-600">Verifying account permissions...</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
