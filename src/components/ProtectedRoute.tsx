import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [redirectPath, setRedirectPath] = useState<string>('/login');
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('ra_token');
    const userStr = localStorage.getItem('ra_user');

    if (!token || !userStr) {
      setAuthState('unauthenticated');
      return;
    }

    // Verify token with backend
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${API_URL}/client-auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          // Support multi-role: use roles array, fall back to [role]
          const roles: string[] = data.data?.roles && data.data.roles.length > 0
            ? data.data.roles
            : [data.data?.role || ''].filter(Boolean);
          setUserRoles(roles);
          setRedirectPath(data.data?.redirectPath || '/login');
          setAuthState('authenticated');
          // Update stored user data with fresh data from server
          localStorage.setItem('ra_user', JSON.stringify(data.data));
        } else {
          throw new Error('Verification failed');
        }
      })
      .catch(() => {
        // Token is invalid or expired — clear everything
        localStorage.removeItem('ra_token');
        localStorage.removeItem('ra_user');
        setAuthState('unauthenticated');
      });
  }, [location.pathname]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  // Role-based access check: user needs at least one matching role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.some(r => userRoles.includes(r))) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
