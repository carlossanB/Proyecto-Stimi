import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // If authenticated but role not allowed, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
