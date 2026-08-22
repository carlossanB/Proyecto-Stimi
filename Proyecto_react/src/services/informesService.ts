import api from './api';

const capitalizeStatus = (status: string) => {
  if (!status) return 'No cargado';
  const s = status.toLowerCase();
  if (s === 'validado' || s === 'aprobado') return 'Validado';
  if (s === 'devuelto' || s === 'rechazado') return 'Devuelto';
  if (s === 'pendiente') return 'Pendiente';
  if (s === 'borrador') return 'Borrador';
  return status;
};

const mapApiReportToUI = (apiReport: any) => {
  const versionsMapped = (apiReport.versiones || []).map((v: any) => ({
    version: v.numero_version,
    archivo: v.archivo_nombre_original,
    size: v.archivo_tamano_bytes ? (v.archivo_tamano_bytes / (1024 * 1024)).toFixed(2) + ' MB' : '0.00 MB',
    fecha: v.fecha_version ? new Date(v.fecha_version).toLocaleString() : '',
    estado: capitalizeStatus(v.estado),
    observacion: v.observacion || '',
    comentarios: v.observacion || '',
    id_version: v.id_version
  }));

  // Sort versions by version number descending (newest first)
  versionsMapped.sort((a: any, b: any) => b.version - a.version);

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Guard: periodo can be null if the report is orphaned
  const periodo = apiReport.periodo ?? null;
  const mesNombre = periodo ? (mesesNombres[periodo.mes - 1] ?? 'Desconocido') : 'Desconocido';
  const periodoStr = periodo ? `${mesNombre} ${periodo.anio}` : '';

  const lastVer = versionsMapped.length > 0 ? versionsMapped[0] : null;

  const carpetaUrl = apiReport.usuario?.carpeta_drive_url 
    ? apiReport.usuario.carpeta_drive_url 
    : null;

  return {
    id: apiReport.id_informe,
    instructorId: apiReport.usuario?.id_usuario?.toString(),
    instructorNombre: apiReport.usuario?.nombre_completo ?? '',
    instructorCorreo: apiReport.usuario?.correo ?? '',
    periodo: periodoStr,
    mes: mesNombre,
    archivoNombre: lastVer ? lastVer.archivo : 'Sin archivos',
    tipo: apiReport.tipo_informe,
    area: apiReport.usuario?.area?.nombre_area ?? '',
    estado: capitalizeStatus(apiReport.estado),
    observacion: apiReport.observacion || '',
    comentarios: apiReport.observacion || '',
    versiones: versionsMapped,
    carpetaUrl: carpetaUrl
  };
};


export const getInformes = async (): Promise<any[]> => {
  const response = await api.get<any[]>('/informes');
  console.log('>>> [DEBUG-API] Raw /informes response:', JSON.stringify(response.data, null, 2));
  return response.data.map(mapApiReportToUI);
};

export const getHistorial = async (): Promise<any[]> => {
  const response = await api.get<any[]>('/informes/historial');
  return response.data.map(mapApiReportToUI);
};

export const getUltimaVersion = (informe: any) => {
  if (!informe || !informe.versiones || informe.versiones.length === 0) return null;
  return informe.versiones[informe.versiones.length - 1];
};

export const addVersion = async (
  periodo: string,
  tipo: string,
  instructorId: string, // Kept for compatibility, backend uses current user context
  archivo: File,
  archivoSizeLabel?: string // Kept for compatibility
): Promise<any> => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('periodo', periodo);
  formData.append('tipo', tipo);

  const response = await api.post('/informes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return mapApiReportToUI(response.data);
};

export const uploadNuevaVersion = async (
  periodo: string,
  tipo: string,
  archivo: File
): Promise<any> => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const response = await api.post(`/informes/${periodo}/${tipo}/version`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return mapApiReportToUI(response.data);
};

export const getDetalleReporte = async (periodo: string, tipo: string): Promise<any> => {
  const response = await api.get(`/informes/${periodo}/${tipo}`);
  if (!response.data || response.data.id_informe === null) {
    return response.data; // Return raw empty state structure
  }
  return mapApiReportToUI(response.data);
};

export const updateEstadoInforme = async (
  id: number,
  nuevoEstado: string,
  comentarios: string = ''
): Promise<any> => {
  // Retrieve the full report to identify its type, period, and owner details
  const response = await api.get<any[]>('/informes');
  const matching = response.data.find(r => r.id_informe === id);
  if (!matching) {
    throw new Error('Informe no encontrado en el servidor.');
  }

  let estadoParam = nuevoEstado.toLowerCase();
  if (estadoParam === 'aprobado' || estadoParam === 'validado') {
    estadoParam = 'validado';
  } else if (estadoParam === 'rechazado' || estadoParam === 'devuelto') {
    estadoParam = 'devuelto';
  }

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mesNombre = mesesNombres[matching.periodo.mes - 1];
  const periodoStr = `${mesNombre} ${matching.periodo.anio}`;

  const patchPayload = {
    estado: estadoParam,
    observacion: comentarios,
    id_usuario: matching.usuario.id_usuario
  };

  const patchResponse = await api.patch(`/informes/${periodoStr}/${matching.tipo_informe}/estado`, patchPayload);
  return mapApiReportToUI(patchResponse.data);
};

export const descargarPdf = async (id: number, nombreArchivo: string): Promise<void> => {
  const response = await api.get(`/informes/${id}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // Use Content-Disposition header filename if available, otherwise use the provided name
  const contentDisp: string = (response.headers as any)['content-disposition'] || '';
  const match = contentDisp.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/);
  const finalName = (match && match[2]) ? match[2].trim() : (nombreArchivo || `informe-${id}.pdf`);
  link.setAttribute('download', finalName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const verPdf = async (id: number): Promise<void> => {
  try {
    const response = await api.get(`/informes/${id}/view`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      throw new Error('El navegador bloquó la ventana emergente. Permite popups para este sitio.');
    }
  } catch (err: any) {
    // When responseType is 'blob', error response data is a Blob — need to parse it
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      try {
        const parsed = JSON.parse(text);
        err.response.data = parsed;
      } catch { /* Not JSON, leave as-is */ }
    }
    throw err;
  }
};

/** Abre en nueva pestaña el PDF de una versión específica (por id_version) */
export const verPdfVersion = async (versionId: number): Promise<void> => {
  try {
    const response = await api.get(`/versiones/${versionId}/view`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      throw new Error('El navegador bloquó la ventana emergente. Permite popups para este sitio.');
    }
  } catch (err: any) {
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      try {
        const parsed = JSON.parse(text);
        err.response.data = parsed;
      } catch { /* Not JSON */ }
    }
    throw err;
  }
};

export const getPdfGcJson = async (id: number): Promise<any> => {
  const response = await api.get(`/informes/${id}/pdf-gc`);
  return response.data;
};

export const descartarUltimaVersion = async (id: number): Promise<any> => {
  const response = await api.delete(`/informes/${id}/version/last`);
  if (!response.data || response.data.id_informe === null) {
    return response.data;
  }
  return mapApiReportToUI(response.data);
};

export const informesService = {
  getInformes,
  getHistorial,
  getUltimaVersion,
  addVersion,
  uploadNuevaVersion,
  getDetalleReporte,
  updateEstadoInforme,
  descargarPdf,
  verPdf,
  verPdfVersion,
  getPdfGcJson,
  descartarUltimaVersion
};
