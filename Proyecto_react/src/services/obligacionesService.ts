import api from './api';
import { Obligacion } from '../types';

export const obligacionesService = {
  getObligaciones: async (): Promise<Obligacion[]> => {
    const response = await api.get<Obligacion[]>('/obligaciones');
    return response.data;
  },

  createObligacion: async (descripcion: string, id_contrato: number): Promise<Obligacion> => {
    const response = await api.post<Obligacion>('/obligaciones', {
      descripcion,
      id_contrato
    });
    return response.data;
  }
};
