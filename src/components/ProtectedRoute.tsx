import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredPermission?: {
    module: 'Dashboard' | 'Sales' | 'Repair' | 'Settings';
    minLevel?: 'View' | 'Full';
  };
}

export default function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#437DFC] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role restrictions if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getFirstAllowedRoute(user)} replace />;
  }

  // Check module permission if specified
  if (requiredPermission && user.role !== 'Admin') {
    const userPerm = user.permissions?.[requiredPermission.module] || 'None';
    const minLevel = requiredPermission.minLevel || 'View';

    if (userPerm === 'None') {
      return <Navigate to={getFirstAllowedRoute(user)} replace />;
    }

    if (minLevel === 'Full' && userPerm !== 'Full') {
      return <Navigate to={getFirstAllowedRoute(user)} replace />;
    }
  }

  return <Outlet />;
}

export function getFirstAllowedRoute(user: any): string {
  if (!user) return '/login';
  if (user.role === 'Admin') return '/';
  
  if (user.permissions?.Dashboard && user.permissions.Dashboard !== 'None') return '/';
  if (user.permissions?.Sales && user.permissions.Sales !== 'None') return '/sales';
  if (user.permissions?.Repair && user.permissions.Repair !== 'None') return '/repairs';
  if (user.permissions?.Settings === 'Full') return '/settings';

  return '/login';
}
