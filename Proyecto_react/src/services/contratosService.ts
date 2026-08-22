import api from './api';
import { Contrato } from '../types';

export const contratosService = {
  getContratos: async (): Promise<Contrato[]> => {
    const response = await api.get<Contrato[]>('/contratos');
    return response.data;
  },

  getContratoById: async (id: number): Promise<Contrato> => {
    const response = await api.get<Contrato>(`/contratos/${id}`);
    return response.data;
  }
};
