import api from './api';

export const instructoresService = {
  // Get all instructors by filtering users list
  getInstructores: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/personas');
    return response.data
      .filter((u: any) => u.rol?.nombre_rol === 'instructor' || !u.rol || u.rol?.nombre_rol !== 'coordinador')
      .map((u: any) => ({
        id: u.id_usuario.toString(),
        nombre: u.nombre_completo,
        email: u.correo,
        documento: u.numero_documento,
        area: u.area?.nombre_area ?? '',
        estado_cuenta: u.estado_cuenta,
        estado: u.estado_cuenta === 'aprobado' ? 'activo' : 'inactivo',
        fichas: [], // Mocked layout array
        totalAprendices: 0,
        carpetaRuta: u.carpeta_drive_url || '',
        informesPendientes: 0,
        ultimoReporte: u.firma_digital_ruta ? 'Firma cargada' : 'Sin firma'
      }));
  },

  // Get specific instructor
  getInstructorById: async (id: string): Promise<any> => {
    const response = await api.get<any>(`/personas/${id}`);
    const u = response.data;
    return {
      id: u.id_usuario.toString(),
      nombre: u.nombre_completo,
      email: u.correo,
      documento: u.numero_documento,
      area: u.area?.nombre_area ?? '',
      estado: u.estado_cuenta === 'aprobado' ? 'activo' : 'inactivo',
      fichas: [],
      totalAprendices: 0,
      carpetaRuta: u.carpeta_drive_url || ''
    };
  },

  // Simulated reminder (not present in NestJS controller)
  enviarRecordatorio: async (id: string): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          message: 'Se ha enviado un correo de recordatorio al instructor para la entrega de informes pendientes.' 
        });
      }, 600);
    });
  }
};
