import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiBell, FiClock, FiCheck, FiInfo, FiInbox, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

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

const POLL_INTERVAL = 30_000; // 30 segundos

export default function NotificacionesFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef(null);

  // ── Polling del contador de no leídas (cada 30s) ─────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      let res;
      try {
        res = await api.get('/notificaciones/unread-count');
      } catch {
        res = await api.get('/notifications/unread-count');
      }
      setUnreadCount(res.data.count ?? 0);
    } catch (_) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount(); // llamada inicial
    const timerId = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(timerId);
  }, [fetchUnreadCount]);
  // ─────────────────────────────────────────────────────────────────────────

  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await api.get('/notificaciones');
      } catch {
        response = await api.get('/notifications');
      }
      const data = Array.isArray(response.data) ? response.data : [];
      setAlertas(data);
      setUnreadCount(data.filter((a) => !(a.leida ?? a.read)).length);
    } catch (err) {
      console.error('Error al cargar notificaciones del coordinador:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAlertas();
    }
  }, [isOpen, fetchAlertas]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      try {
        await api.patch('/notificaciones/leer-todas');
      } catch {
        await api.patch('/notifications/read-all');
      }
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar notificaciones como leídas:', err);
    }
  };

  const markOneAsRead = async (id) => {
    try {
      try {
        await api.patch(`/notificaciones/${id}/leer`);
      } catch {
        await api.patch(`/notifications/${id}/read`);
      }
      setAlertas((prev) => prev.map((a) => {
        const item = a.id_notificacion ?? a.id;
        return item === id ? { ...a, leida: true, read: true } : a;
      }));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  // ── Eliminar notificación ────────────────────────────────────────────────
  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      try {
        await api.delete(`/notificaciones/${id}`);
      } catch {
        await api.delete(`/notifications/${id}`);
      }
      const removed = alertas.find((a) => (a.id_notificacion ?? a.id) === id);
      setAlertas((prev) => prev.filter((a) => (a.id_notificacion ?? a.id) !== id));
      if (removed && !(removed.leida ?? removed.read)) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={popoverRef}>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer relative"
        title="Notificaciones"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-4 space-y-3 origin-bottom-right z-50 transition-all duration-200 text-gray-900 dark:text-gray-100">
          <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700 pb-2">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider">Notificaciones</h4>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-[#407754] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-[#407754] dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-400 dark:text-gray-500">
                <FiInbox className="w-8 h-8" />
                <p className="text-xs font-semibold">Sin notificaciones</p>
              </div>
            ) : (
              alertas.map((alerta) => {
                const id = alerta.id_notificacion ?? alerta.id;
                const msg = alerta.mensaje || alerta.message || alerta.title || 'Notificación';
                const tipo = alerta.tipo || alerta.type || 'info';
                const isRead = alerta.leida ?? alerta.read ?? false;
                const dateStr = alerta.created_at || alerta.createdAt;

                return (
                  <div
                    key={id}
                    onClick={() => !isRead && markOneAsRead(id)}
                    className={`group p-3 rounded-xl border text-[11px] leading-relaxed transition-colors flex gap-2 cursor-pointer ${
                      isRead
                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                        : 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {tipo === 'warning' || tipo === 'error' ? (
                        <FiInfo className="text-amber-500 w-3.5 h-3.5" />
                      ) : (
                        <FiCheck className="text-[#407754] dark:text-emerald-400 w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className={isRead ? 'font-normal' : 'font-semibold'}>{msg}</p>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" /> {timeAgo(dateStr)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => deleteOne(e, id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400 text-gray-300 dark:text-gray-600 cursor-pointer"
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                      {!isRead && (
                        <span className="mt-1 w-2 h-2 bg-[#407754] dark:bg-emerald-400 rounded-full shrink-0"></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-center pt-1 border-t border-gray-50 dark:border-gray-700">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">STIMI · Notificaciones en tiempo real</span>
          </div>
        </div>
      )}
    </div>
  );
}

