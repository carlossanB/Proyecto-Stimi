import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { FiHome, FiFileText, FiSettings, FiUser, FiBell, FiLogOut, FiCheckSquare, FiMoon, FiSun, FiMail, FiBook, FiCalendar, FiKey } from 'react-icons/fi';
import logoSena from '../assets/logo-sena.png';
import api from '../services/api';
import NotificacionesPanel from '../components/NotificacionesPanel';
import AsistenteWidget from '../components/AsistenteWidget';
import WhatsAppFAB from '../components/WhatsAppFAB';

export default function InstructorLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const bellFabRef = useRef(null);

  // ── Polling del contador de no leídas (cada 30s) ───────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notificaciones/unread-count');
      setUnreadCount(res.data.count ?? 0);
    } catch (_) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const timerId = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(timerId);
  }, [fetchUnreadCount]);
  // ─────────────────────────────────────────────────────────────────────────────

  const navItems = [
    { name: t('sidebar.home', 'Inicio'), path: '/instructor/dashboard', icon: FiHome },
    { name: t('sidebar.currentPeriod', 'Período Actual'), path: '/instructor/periodo-actual', icon: FiCheckSquare },
    { name: t('sidebar.history', 'Historial'), path: '/instructor/informes', icon: FiFileText },
    { name: t('sidebar.settings', 'Configuración'), path: '/instructor/configuracion', icon: FiSettings },
    { name: t('sidebar.profile', 'Perfil'), path: '/instructor/perfil', icon: FiUser },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('sidebar.instructor', 'Instructor')}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
                    isActive 
                      ? 'bg-green-50 dark:bg-green-900/30 text-[#407754] dark:text-emerald-400 font-bold' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-[#407754] dark:text-emerald-400' : ''}`} />
                  <span className={`ml-4 text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section — Theme Toggle, User Info & Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
          {/* Quick Theme Toggle Button */}
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

          {/* User Info (Rol + Nombre) — hover to open popover */}
          <div
            className="relative"
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            <button
              className={`w-full flex items-center px-3 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 overflow-hidden ${
                isProfileOpen ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''
              }`}
              title={t('sidebar.profile', 'Perfil')}
            >
              <FiUser className="w-6 h-6 shrink-0" />
              <div className="ml-4 flex flex-col items-start whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate w-32 text-left">{t('sidebar.instructor', 'Instructor')}</span>
                <span className="text-sm font-bold truncate w-32 text-left text-gray-700 dark:text-gray-200">{user?.nombreCompleto || 'Instructor'}</span>
              </div>
            </button>

            {/* Profile Popover Panel */}
            {isProfileOpen && (
              <div className="absolute bottom-full left-20 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-5 z-50 origin-bottom-left space-y-4 text-gray-900 dark:text-gray-100">
                {/* Popover Header with Avatar */}
                <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 pb-3">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/40 text-[#407754] dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0">
                    {user?.nombreCompleto ? user.nombreCompleto.substring(0, 2).toUpperCase() : 'IN'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{user?.nombreCompleto || 'Instructor STIMI'}</h4>
                    <span className="bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                      Instructor
                    </span>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <FiMail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Correo Institucional</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email || 'instructor@sena.edu.co'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FiKey className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Documento de Identidad</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{user?.documento || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FiBook className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Centro / Sede</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200 leading-tight block">
                        {user?.sede_centro || 'Centro de Gestión y Desarrollo Sostenible Surcolombiano'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Regional</span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {user?.regional || 'Regional Huila'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                  <button
                    onClick={() => { navigate('/instructor/perfil'); setIsProfileOpen(false); }}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-200 text-[10px] font-bold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Editar perfil
                  </button>
                </div>
              </div>
            )}
          </div>

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

      {/* Floating Bubbles Column — bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* Notification FAB */}
        <div className="relative" ref={bellFabRef}>
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer ${
              isNotifOpen ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
            title="Notificaciones"
          >
            <FiBell className={`w-6 h-6 ${isNotifOpen ? 'text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-300'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-white dark:ring-gray-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel — anchored above the FAB */}
          <NotificacionesPanel
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            anchorRef={bellFabRef}
            onUnreadChange={setUnreadCount}
          />
        </div>

        {/* WhatsApp Support FAB */}
        <WhatsAppFAB sizeClass="w-14 h-14 shadow-xl" iconSizeClass="w-7 h-7" />

        {/* AI Assistant FAB */}
        <AsistenteWidget />
      </div>

    </div>
  );
}

