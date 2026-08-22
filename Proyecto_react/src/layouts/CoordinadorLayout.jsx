import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { 
  FiHome, 
  FiFileText, 
  FiBarChart2, 
  FiUsers, 
  FiSettings, 
  FiUser, 
  FiLogOut,
  FiMail,
  FiBook,
  FiCalendar,
  FiKey,
  FiMoon,
  FiSun
} from 'react-icons/fi';
import { toast } from 'sonner';
import NotificacionesFAB from '../components/NotificacionesFAB';
import AsistenteFAB from '../components/AsistenteFAB';
import logoSena from '../assets/logo-sena.png';
import WhatsAppFAB from '../components/WhatsAppFAB';

export default function CoordinadorLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileContainerRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  // Listen to clicks outside and ESC key for profile popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const navItems = [
    { path: '/coordinador', icon: FiHome, label: t('sidebar.home', 'Inicio'), exact: true },
    { path: '/coordinador/revision', icon: FiFileText, label: t('sidebar.reportsReview', 'Revisión Informes') },
    { path: '/coordinador/reportes', icon: FiBarChart2, label: t('sidebar.reports', 'Reportes') },
    { path: '/coordinador/usuarios', icon: FiUsers, label: t('sidebar.users', 'Usuarios') },
    { path: '/coordinador/configuracion', icon: FiSettings, label: t('sidebar.settings', 'Configuración') },
    { path: '/coordinador/perfil', icon: FiUser, label: t('sidebar.myProfile', 'Mi Perfil') },
  ];

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar - Collapsible */}
      <aside className="group relative w-[90px] hover:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-30 flex flex-col justify-between shadow-sm">
        
        {/* Top Section */}
        <div>
          {/* Header & Logo */}
          <div className="h-20 flex items-center justify-center px-4 transition-all border-b border-gray-100 dark:border-gray-700">
            <img src={logoSena} alt="Logo SENA" className="w-10 h-10 object-contain shrink-0" />
            <div className="ml-3 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
              <h2 className="font-bold text-[#407754] dark:text-emerald-400 text-sm leading-tight">STIMI</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('sidebar.coordinador', 'Coordinación')}</p>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
                    isActive 
                      ? 'bg-green-50 dark:bg-green-900/30 text-[#407754] dark:text-emerald-400 font-bold' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-[#407754] dark:text-emerald-400' : ''}`} />
                  <span className={`ml-4 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions Section */}
        <div className="w-full flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 p-3 relative" ref={profileContainerRef}>
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 overflow-hidden cursor-pointer"
            title={theme === 'light' ? t('sidebar.themeDark', 'Modo Oscuro') : t('sidebar.themeLight', 'Modo Claro')}
          >
            {theme === 'light' ? (
              <FiMoon className="w-6 h-6 shrink-0 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <FiSun className="w-6 h-6 shrink-0 text-amber-400" />
            )}
            <div className="ml-4 flex flex-col items-start whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {theme === 'light' ? t('sidebar.themeDark', 'Modo Oscuro') : t('sidebar.themeLight', 'Modo Claro')}
              </span>
            </div>
          </button>

          {/* Profile Toggle Button */}
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 overflow-hidden ${
              isProfileOpen ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''
            }`}
            title="Perfil"
          >
            <FiUser className="w-6 h-6 shrink-0" />
            <div className="ml-4 flex flex-col items-start whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate w-32 text-left">Coordinador</span>
              <span className="text-sm font-bold truncate w-32 text-left">{user?.nombreCompleto || 'Perfil'}</span>
            </div>
          </button>

          {/* Profile Popover Panel */}
          {isProfileOpen && (
            <div 
              className="absolute bottom-16 left-20 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-5 z-50 animate-fade-in origin-bottom-left space-y-4 text-gray-900 dark:text-gray-100"
            >
              {/* Popover Header with Avatar */}
              <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 pb-3">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/40 text-[#407754] dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0">
                  {user?.nombreCompleto ? user.nombreCompleto.substring(0, 2).toUpperCase() : 'CO'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{user?.nombreCompleto || 'Coordinador STIMI'}</h4>
                  <span className="bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                    Coordinador Académico
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <FiMail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Correo Institucional</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email || 'coordinador@sena.edu.co'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FiKey className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Documento de Identidad</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{user?.documento || '52887643'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FiBook className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Centro / Sede</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200 leading-tight block">
                      {user?.centro || 'Centro de Servicios y Gestión Empresarial - Regional Antioquia'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Vinculación</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {user?.vinculacion || 'Contratista - Desde Febrero 2024'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                <button 
                  onClick={() => { navigate('/coordinador/perfil', { state: { editMode: true } }); setIsProfileOpen(false); }}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-200 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center"
                >
                  Editar perfil
                </button>
              </div>
            </div>
          )}

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-200 overflow-hidden cursor-pointer"
            title={t('common.logout', 'Cerrar Sesión')}
          >
            <FiLogOut className="w-6 h-6 shrink-0" />
            <div className="ml-4 flex flex-col items-start whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <span className="text-sm font-bold truncate w-32 text-left mt-0.5">{t('common.logout', 'Cerrar Sesión')}</span>
            </div>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        <NotificacionesFAB />
        <WhatsAppFAB sizeClass="w-12 h-12 shadow-lg" iconSizeClass="w-5 h-5" />
        <AsistenteFAB />
      </div>

    </div>
  );
}

