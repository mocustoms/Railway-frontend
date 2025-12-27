import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Wait for auth state to load before making routing decisions
  if (isLoading) {
    // Show loading state or return null while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has a company (except for company registration page, welcome-initialization, and system admins)
  // System admins don't need a company
  // Allow welcome-initialization even if context hasn't updated yet (user data is in localStorage)
  if (!user?.companyId && !user?.isSystemAdmin && 
      location.pathname !== '/register-company' && 
      location.pathname !== '/welcome-initialization' &&
      location.pathname !== '/select-initialization-data' &&
      location.pathname !== '/initialize-company' &&
      location.pathname !== '/manual-configuration-steps') {
    // Check localStorage directly in case context hasn't updated yet
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!storedUser?.companyId) {
        // Redirect to company registration if user doesn't have a company
        return <Navigate to="/register-company" replace />;
      }
    } catch {
      // If localStorage check fails, redirect to company registration
      return <Navigate to="/register-company" replace />;
    }
  }

  // Check role-based access if required
  if (requiredRole === 'system_admin' && !user?.isSystemAdmin) {
    // Redirect to unauthorized page or app main
    return <Navigate to="/app-main" replace />;
  }
  
  if (requiredRole && requiredRole !== 'system_admin' && user?.role !== requiredRole) {
    // Redirect to unauthorized page or app main
    return <Navigate to="/app-main" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 