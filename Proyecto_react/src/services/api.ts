import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
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
        // Adjuntar el centroId/centroSlug como header x-tenant-id si existe
        const centroId: string | undefined =
          user.centroId || user.centroSlug || user.centro || undefined;

        if (centroId) {
          config.headers['x-tenant-id'] = centroId;
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Logging out...');
      localStorage.removeItem('stimi_token');
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
