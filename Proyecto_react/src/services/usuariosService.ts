import api from './api';
import { User, Rol, Area } from '../types';

export const usuariosService = {
  // Get all users (Coordinators only)
  getUsuarios: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/personas');
    return response.data.map((u) => ({
      id: u.id_usuario,
      nombre: u.nombre_completo,
      email: u.correo,
      rol: u.rol?.nombre_rol ?? 'instructor',
      estado: u.estado_cuenta === 'aprobado' ? 'activo' : 'inactivo',
      estado_cuenta: u.estado_cuenta,
      documento: u.numero_documento,
      tipo_documento: u.tipo_documento,
      area: u.area?.nombre_area ?? '',
      id_area: u.area?.id_area ?? null,
      id_rol: u.rol?.id_rol ?? null,
      firma_digital_ruta: u.firma_digital_ruta,
      foto_perfil_ruta: u.foto_perfil_ruta ?? null,
      motivo_rechazo: u.motivo_rechazo
    }));
  },

  // Create a new user (usually via registration, but can be done by Coordinator)
  crearUsuario: async (usuarioData: {
    nombre: string;
    email: string;
    rol: string;
    documento: string;
    area: string;
    contrasena?: string;
    id_rol?: number;
    id_area?: number;
  }): Promise<any> => {
    // 1. Post to registration endpoint
    const regPayload = {
      nombreCompleto: usuarioData.nombre,
      email: usuarioData.email,
      tipoDocumento: 'CC', // default to CC
      numeroDocumento: usuarioData.documento,
      contrasena: usuarioData.contrasena || 'sena123456', // default password if not provided
      confirmarContrasena: usuarioData.contrasena || 'sena123456'
    };

    const response = await api.post('/personas', regPayload);
    
    // Find the newly registered user by document to get their ID
    const allUsers = await api.get<any[]>('/personas');
    const newUser = allUsers.data.find(u => u.numero_documento === usuarioData.documento);
    
    if (newUser) {
      // 2. Patch with assigned role, area and automatically approve since coordinator created it
      let idRol = usuarioData.id_rol;
      let idArea = usuarioData.id_area;

      if (!idRol) {
        const roles = await api.get<Rol[]>('/rol');
        const found = roles.data.find(r => r.nombre_rol === usuarioData.rol);
        if (found) idRol = found.id_rol;
      }

      if (!idArea && usuarioData.area) {
        const areas = await api.get<Area[]>('/areas');
        const found = areas.data.find(a => a.nombre_area.toLowerCase().includes(usuarioData.area.toLowerCase()));
        if (found) idArea = found.id_area;
      }

      const patchPayload = {
        estado_cuenta: 'aprobado',
        id_rol: idRol || undefined,
        id_area: idArea || undefined
      };

      await api.patch(`/personas/${newUser.id_usuario}`, patchPayload);
    }

    return response.data;
  },

  // Update user data (Coordinator can approve/reject, edit role and area)
  actualizarUsuario: async (
    id: number,
    datos: {
      nombre?: string;
      email?: string;
      rol?: string;
      documento?: string;
      estado_cuenta?: string;
      id_rol?: number;
      id_area?: number;
      motivo_rechazo?: string;
    }
  ): Promise<any> => {
    const payload: any = {};
    if (datos.nombre !== undefined) payload.nombreCompleto = datos.nombre;
    if (datos.email !== undefined) payload.email = datos.email;
    if (datos.documento !== undefined) payload.numeroDocumento = datos.documento;
    if (datos.estado_cuenta !== undefined) payload.estado_cuenta = datos.estado_cuenta;
    if (datos.motivo_rechazo !== undefined) payload.motivo_rechazo = datos.motivo_rechazo;
    if (datos.id_rol !== undefined) payload.id_rol = datos.id_rol;
    if (datos.id_area !== undefined) payload.id_area = datos.id_area;

    const response = await api.patch(`/personas/${id}`, payload);
    return response.data;
  },

  // Toggle user active status (approved vs pending/rejected)
  toggleEstadoUsuario: async (id: number): Promise<any> => {
    // Get user details first
    const responseUser = await api.get<any>(`/personas/${id}`);
    const currentStatus = responseUser.data.estado_cuenta;
    const nextStatus = currentStatus === 'aprobado' ? 'pendiente' : 'aprobado';

    const patchPayload = {
      estado_cuenta: nextStatus
    };

    const response = await api.patch(`/personas/${id}`, patchPayload);
    return {
      ...response.data,
      estado: nextStatus === 'aprobado' ? 'activo' : 'inactivo'
    };
  },

  // Remove a user
  eliminarUsuario: async (id: number): Promise<any> => {
    const response = await api.delete(`/personas/${id}`);
    return response.data;
  },

  // Fetch all roles
  getRoles: async (): Promise<Rol[]> => {
    const response = await api.get<Rol[]>('/rol');
    return response.data;
  },

  // Fetch all areas
  getAreas: async (): Promise<Area[]> => {
    const response = await api.get<Area[]>('/areas');
    return response.data;
  }
};
