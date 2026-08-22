import api from './api';

/**
 * Envía un mensaje al asistente del coordinador vía NestJS → n8n.
 * Requiere que el usuario esté autenticado (token JWT en localStorage).
 */
export const enviarMensajeCoordinador = async (
  mensaje: string,
): Promise<{ respuesta: string }> => {
  const response = await api.post<{ respuesta: string }>('/coordinador/chat', {
    mensaje,
  });
  return response.data;
};

export const coordinadorService = {
  enviarMensajeCoordinador,
};
