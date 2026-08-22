import api from './api';
import { Actividad } from '../types';

export const actividadesService = {
  getActividades: async (): Promise<Actividad[]> => {
    const response = await api.get<Actividad[]>('/actividades');
    return response.data;
  },

  createActividad: async (actividad: {
    competencia: string;
    resultado: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado?: string;
    fk_gc?: number;
  }): Promise<Actividad> => {
    const response = await api.post<Actividad>('/actividades', {
      competencia: actividad.competencia,
      resultado: actividad.resultado,
      fecha_inicio: actividad.fecha_inicio,
      fecha_fin: actividad.fecha_fin,
      estado: actividad.estado || 'ACT',
      fk_gc: actividad.fk_gc
    });
    return response.data;
  },

  actualizarActividad: async (id: number, actividad: Partial<Actividad>): Promise<Actividad> => {
    const response = await api.patch<Actividad>(`/actividades/${id}`, actividad);
    return response.data;
  },

  eliminarActividad: async (id: number): Promise<void> => {
    await api.delete(`/actividades/${id}`);
  }
};
