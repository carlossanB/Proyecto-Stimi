import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem('stimi_token');
  const hasValidSession = isAuthenticated && !!token && !!user;

  if (!hasValidSession) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Si el rol no corresponde, redirigir al dashboard correcto según el rol
    if (user.rol === 'instructor' || user.rol === 'coordinador') {
      return <Navigate to={`/${user.rol}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
