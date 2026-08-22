import api from './api';

// ── Tipos compartidos ─────────────────────────────────────────────────────────
export interface ChatMessage {
  rol: 'user' | 'assistant';
  contenido: string;
}

export interface ChatRequest {
  mensaje: string;
  historial?: ChatMessage[];
}

export interface ChatResponse {
  respuesta: string;
}

export interface ChatUploadResponse {
  respuesta: string;
  estado: 'validado' | 'devuelto' | 'pendiente';
  id_informe?: number;
}

// ── Chat de texto (sin archivos) ──────────────────────────────────────────────
/**
 * Envía un mensaje de texto al Asistente IA de STIMI.
 * Requiere que el usuario esté autenticado (token JWT en localStorage).
 */
export const enviarMensajeAsistente = async (
  mensaje: string,
  historial: ChatMessage[] = [],
): Promise<ChatResponse> => {
  const payload: ChatRequest = {
    mensaje,
    historial: historial.slice(-10),
  };
  const response = await api.post<ChatResponse>('/webhooks/chat', payload);
  return response.data;
};

// ── Chat con archivo PDF (validación de informe) ──────────────────────────────
/**
 * Sube un informe PDF al backend para que sea analizado por la IA.
 * Requiere que el usuario esté autenticado.
 *
 * @param archivo      - Objeto File del informe PDF seleccionado por el usuario
 * @param tipoInforme  - 'GC' o 'GF'
 * @param periodo      - Período en formato "Mes YYYY" (e.g. "Julio 2026")
 */
export const enviarArchivoInforme = async (
  archivo: File,
  tipoInforme: string,
  periodo: string,
): Promise<ChatUploadResponse> => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('tipo_informe', tipoInforme.toUpperCase());
  formData.append('periodo', periodo);

  const response = await api.post<ChatUploadResponse>(
    '/webhooks/chat/upload',
    formData,
    {
      // Timeout extendido a 3 minutos: n8n procesa 3 lotes de OpenAI en paralelo
      timeout: 180000,
      headers: {
        // Eliminar el Content-Type fijo de la instancia axios para que el browser
        // establezca automáticamente 'multipart/form-data; boundary=...' al detectar FormData.
        // Sin esto, Multer no reconoce el archivo y devuelve 400.
        'Content-Type': undefined,
      },
    },
  );
  return response.data;
};

export const asistenteService = {
  enviarMensajeAsistente,
  enviarArchivoInforme,
};
