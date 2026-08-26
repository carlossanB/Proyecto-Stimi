import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider, AuthContext } from './components/AuthContext';
import { PeriodoProvider } from './components/PeriodoContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import RecuperarContrasena from './pages/RecuperarContrasena';
import Registro from './pages/Registro';
import DashboardPlaceholder from './pages/DashboardPlaceholder';

import CoordinadorLayout from './layouts/CoordinadorLayout';
import DashboardCoordinador from './pages/coordinador/Dashboard';
import RevisionInformes from './pages/coordinador/RevisionInformes';
import Reportes from './pages/coordinador/Reportes';
import GestionUsuarios from './pages/coordinador/GestionUsuarios';
import ConfiguracionCoordinador from './pages/coordinador/Configuracion';
import AsistenteIA from './pages/coordinador/AsistenteIA';
import PerfilCoordinador from './pages/coordinador/Perfil';

import InstructorLayout from './layouts/InstructorLayout';
import DashboardInstructor from './pages/instructor/Dashboard';
import MisInformes from './pages/instructor/MisInformes';
import ConfiguracionInstructor from './pages/instructor/Configuracion';
import PeriodoActual from './pages/instructor/PeriodoActual';
import Perfil from './pages/instructor/Perfil';

import { useAuth } from './hooks/useAuth';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem('stimi_token');
  const hasValidSession = isAuthenticated && !!token && !!user;

  if (!hasValidSession) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/${user.rol}`} replace />;
}

function App() {
  return (
    <ThemeProvider>
      <PeriodoProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            <Route path="/registro" element={<Registro />} />

            {/* Protected Instructor Route */}
            <Route
              path="/instructor"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <InstructorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardInstructor />} />
              <Route path="informes" element={<MisInformes />} />
              <Route path="periodo-actual" element={<PeriodoActual />} />
              <Route path="configuracion" element={<ConfiguracionInstructor />} />
              <Route path="perfil" element={<Perfil />} />
            </Route>

            {/* Protected Coordinador Route Layout */}
            <Route
              path="/coordinador"
              element={
                <ProtectedRoute allowedRoles={['coordinador']}>
                  <CoordinadorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardCoordinador />} />
              <Route path="revision" element={<RevisionInformes />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="usuarios" element={<GestionUsuarios />} />
              <Route path="configuracion" element={<ConfiguracionCoordinador />} />
              <Route path="asistente" element={<AsistenteIA />} />
              <Route path="perfil" element={<PerfilCoordinador />} />
            </Route>

            {/* Root & Fallback redirects */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </PeriodoProvider>
    </ThemeProvider>
  );
}

export default App;