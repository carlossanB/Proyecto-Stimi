import axios from 'axios';

const api = axios.create({ // donde se envian las peticiones al backend
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`, // url del backend
  maxBodyLength: 60 * 1024 * 1024, // 60 MB para soportar subida de PDFs
  maxContentLength: 60 * 1024 * 1024,
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Adjunta el JWT Bearer Token y, opcionalmente, el header x-tenant-id para
// la arquitectura Multitenant. No rompe el comportamiento si el usuario no
// tiene un Centro de Formación asignado (fallback transparente al backend).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stimi_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ── Identificador del Centro de Formación (Multitenant) ─────────────────
    const userStr = localStorage.getItem('stimi_user');
    if (userStr && config.headers) {
      try {
        const user = JSON.parse(userStr);
        // tenantId es el campo canónico emitido por el backend desde la Fase 3.
        // Los campos legacy (centroId, centroSlug, centro) se mantienen como
        // fallback para compatibilidad con tokens emitidos antes de la migración.
        const tenantId: string | undefined =
          user.tenantId || user.centroId || user.centroSlug || user.centro || undefined;

        if (tenantId) {
          config.headers['x-tenant-id'] = tenantId;
        }
      } catch (_) {
        // Si el JSON no es válido no hacer nada (fallback a tenant por defecto)
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor ─────────────────────────────────────────────────────
// Maneja errores globales: token expirado / 401 Unauthorized
api.interceptors.response.use( // Maneja errores globales
  (response) => response, // si la respuesta es exitosa
  (error) => { // si la respuesta es un error
    if (error.response && error.response.status === 401) { // si el error es 401 Unauthorized
      console.warn('Session expired or unauthorized. Logging out...'); // muestra un mensaje de advertencia
      localStorage.removeItem('stimi_token'); // elimina el token
      localStorage.removeItem('stimi_user');
      // Solo redirigir si no estamos ya en una página pública
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/registro') &&
        !window.location.pathname.includes('/recuperar-contrasena')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
