/**
 * TEMPORAL: Este componente es un marcador de posición (placeholder) temporal
 * para probar el flujo de inicio de sesión, la persistencia y la protección de rutas.
 * Será reemplazado en fases posteriores por el módulo real del Dashboard.
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { FiLogOut, FiSun, FiMoon, FiUser, FiCheckCircle } from 'react-icons/fi';

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sena-green-light rounded-full flex items-center justify-center text-sena-green font-bold text-xl">
              S
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white block text-sm sm:text-base leading-tight">
                STIMI - SENA
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Trazabilidad de Informes
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
              title="Cambiar tema"
            >
              {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center transition-all duration-300">
          <div className="w-20 h-20 bg-sena-green-light rounded-full flex items-center justify-center text-sena-green text-4xl mx-auto mb-6">
            <FiCheckCircle />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            ¡Acceso Exitoso!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto text-sm sm:text-base">
            Esta es una vista temporal de prueba para comprobar la autenticación y la persistencia de sesión.
          </p>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300">
                <FiUser className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider block font-semibold">
                  Usuario autenticado
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block">
                  {user?.email}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rol Asignado:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sena-green-light text-sena-green dark:bg-sena-green/10 dark:text-sena-green-light capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            El módulo del dashboard con las métricas y reportes será implementado en las siguientes etapas.
          </div>
        </div>
      </main>
    </div>
  );
}
