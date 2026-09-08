import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

import api from '../services/api';
import axios from 'axios';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('stimi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ── Hidratación de sesión activa ────────────────────────────────────────────
  // Al montar la app, si hay sesión guardada, refresca los datos del usuario
  // desde el backend para obtener campos actualizados (regional, sede_centro, etc.)
  useEffect(() => {
    const token = localStorage.getItem('stimi_token');
    const savedUser = localStorage.getItem('stimi_user');
    if (!token || !savedUser) return;

    const parsed = JSON.parse(savedUser);
    if (!parsed?.id_usuario) return;

    api.get(`/personas/${parsed.id_usuario}`)
      .then(({ data }) => {
        const rolStr = typeof data.rol === 'object' && data.rol !== null
          ? data.rol.nombre_rol
          : data.rol;
        const areaStr = typeof data.area === 'object' && data.area !== null
          ? data.area.nombre_area
          : data.area;

        const freshUser = {
          ...parsed, // mantiene cualquier campo extra ya en localStorage
          id_usuario: data.id_usuario,
          email: data.correo,
          correo: data.correo,
          nombreCompleto: data.nombre_completo,
          rol: rolStr,
          role: rolStr,
          area: areaStr,
          documento: data.numero_documento,
          tipo_documento: data.tipo_documento,
          numero_documento: data.numero_documento,
          firma_digital_ruta: data.firma_digital_ruta || '',
          foto_perfil_ruta: data.foto_perfil_ruta || null,
          regional: data.regional || null,
          sede_centro: data.sede_centro || null,
        };

        setUser(freshUser);
        localStorage.setItem('stimi_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        // Si falla (token expirado, sin red), no hacemos nada — el logout
        // lo maneja el interceptor de Axios si es 401.
      });
  // 
  }, []);
  // ────────────────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    try {
      // Envía el correo y la contraseña al backend para autenticación.
      const response = await api.post('/auth/login', {
        username: email,
        password: password,
      });

      const { token, user: apiUser } = response.data;

      // Guarda el token en localStorage
      localStorage.setItem('stimi_token', token); // guarda el token

      const rolStr = typeof apiUser.rol === 'object' && apiUser.rol !== null
        ? apiUser.rol.nombre_rol
        : apiUser.rol;

      const areaStr = typeof apiUser.area === 'object' && apiUser.area !== null
        ? apiUser.area.nombre_area
        : apiUser.area;

      // Constructor del objeto de datos del usuario, mapeando todos los campos de la respuesta del backend
      const userData = {
        id_usuario: apiUser.id_usuario,
        email: apiUser.correo,
        correo: apiUser.correo,
        nombreCompleto: apiUser.nombre_completo,
        rol: rolStr,
        role: rolStr, // Expose role for compatibility with existing components
        area: areaStr,
        documento: apiUser.numero_documento,
        tipo_documento: apiUser.tipo_documento,
        numero_documento: apiUser.numero_documento,
        firma_digital_ruta: apiUser.firma_digital_ruta || '',
        foto_perfil_ruta: apiUser.foto_perfil_ruta || null,
        regional: apiUser.regional || null,
        sede_centro: apiUser.sede_centro || null,
      };

      setUser(userData);
      localStorage.setItem('stimi_user', JSON.stringify(userData)); // guarda el usuario
      return userData;
    } catch (error) {
      console.error('Error during login:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Correo, documento o contraseña incorrectos');
      }
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stimi_user');
    localStorage.removeItem('stimi_token');
  };

  const updateLocalUser = (updatedFields) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('stimi_user', JSON.stringify(updatedUser));
  };

  /**
   * Cambiar contraseña del usuario autenticado.
   * Llama a PATCH /auth/change-password con la contraseña actual y la nueva.
   * Lanza un Error con el mensaje del backend si falla.
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar la contraseña');
      }
      throw new Error('No se pudo conectar con el servidor.');
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateLocalUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}