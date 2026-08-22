import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiClock, FiX, FiInbox, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';

const iconMap = {
  success: <FiCheckCircle className="w-5 h-5 text-emerald-500" />,
  warning: <FiAlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <FiAlertCircle className="w-5 h-5 text-blue-500" />,
  error: <FiAlertCircle className="w-5 h-5 text-red-500" />,
};

const bgMap = {
  success: 'bg-emerald-50 dark:bg-emerald-950/40',
  warning: 'bg-amber-50 dark:bg-amber-950/40',
  info: 'bg-blue-50 dark:bg-blue-950/40',
  error: 'bg-red-50 dark:bg-red-950/40',
};

/** Converts an ISO timestamp to a human-readable relative time string */
function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return new Date(isoStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function NotificacionesPanel({ isOpen, onClose, anchorRef, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Sync unread count to parent layout
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // Fetch notifications from the real backend (GET /api/notifications)
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error al marcar notificaciones como leídas:', err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  // ── Eliminar notificación (DELETE /api/notifications/:id) ──────────────────────
  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full right-0 mb-3 w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 text-gray-900 dark:text-gray-100"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Centro de Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="text-xs text-[#407754] dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Marcar leídas
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-3 border-[#407754] dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-medium">Cargando notificaciones...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-center text-red-500">
            <FiAlertCircle className="w-8 h-8" />
            <p className="text-xs font-bold">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-1 px-3 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Reintentar
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-gray-500">
            <FiInbox className="w-10 h-10" />
            <p className="text-sm font-semibold">Sin notificaciones</p>
            <p className="text-xs">No tienes notificaciones por el momento</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && markOneRead(notif.id)}
              className={`group px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                !notif.isRead ? 'bg-green-50/30 dark:bg-green-950/20' : ''
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${bgMap[notif.type] || bgMap.info}`}>
                {iconMap[notif.type] || iconMap.info}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => deleteOne(e, notif.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-300 dark:text-gray-600 hover:text-red-400 cursor-pointer"
                  title="Eliminar notificación"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
                {!notif.isRead && (
                  <span className="w-2 h-2 bg-[#407754] dark:bg-emerald-400 rounded-full"></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-center">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">STIMI · Notificaciones en tiempo real</p>
      </div>
    </div>
  );
}

