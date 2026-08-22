import api from './api';
import { Evidencia } from '../types';

export const evidenciasService = {
  getEvidencias: async (): Promise<Evidencia[]> => {
    const response = await api.get<Evidencia[]>('/evidencias');
    return response.data;
  },

  createEvidencia: async (evidencia: {
    descripcion: string;
    carpeta_obligacion: string;
    ruta_archivo: string;
    tipo_archivo: string;
    tamano_bytes: number;
    fk_actividades: number;
  }): Promise<Evidencia> => {
    const response = await api.post<Evidencia>('/evidencias', evidencia);
    return response.data;
  },

  actualizarEvidencia: async (id: number, evidencia: Partial<Evidencia>): Promise<Evidencia> => {
    const response = await api.patch<Evidencia>(`/evidencias/${id}`, evidencia);
    return response.data;
  },

  eliminarEvidencia: async (id: number): Promise<void> => {
    await api.delete(`/evidencias/${id}`);
  }
};
