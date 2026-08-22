export interface InformeGcPdfAreaDto {
  id_area: number;
  nombre_area: string;
}

export interface InformeGcPdfRolDto {
  id_rol: number;
  nombre_rol: string;
}

export interface InformeGcPdfInstructorDto {
  id_usuario: number;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  correo: string;
  area: InformeGcPdfAreaDto;
  rol: InformeGcPdfRolDto;
  firma_digital_ruta: string | null;
}

export interface InformeGcPdfPeriodoDto {
  id_periodo: number;
  anio: number;
  mes: number;
}

export interface InformeGcPdfObligacionDto {
  id_obligacion: number;
  descripcion: string;
}

export interface InformeGcPdfContratoDto {
  id_contrato: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  obligaciones: InformeGcPdfObligacionDto[];
}

export interface InformeGcPdfCoordinadorDto {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  area: InformeGcPdfAreaDto | null;
  rol: InformeGcPdfRolDto | null;
}

export interface InformeGcPdfEvidenciaDto {
  id_evidencia: number;
  descripcion: string;
  carpeta_obligacion: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
}

export interface InformeGcPdfActividadDto {
  id_actividad: number;
  fecha_inicio: string;
  fecha_fin: string;
  competencia: string;
  resultado: string;
  estado: string;
  evidencias: InformeGcPdfEvidenciaDto[];
}

export interface InformeGcPdfTotalesDto {
  total_actividades: number;
  total_evidencias: number;
}

export interface InformeGcPdfEstadisticasDto {
  actividades_por_competencia: Record<string, number>;
}

export interface InformeGcPdfResponseDto {
  informe: {
    id_informe: number;
    tipo_informe: string;
    estado: string;
    firmado: boolean;
    pendiente_sincronizacion: boolean;
    fecha_envio: string | null;
    version_formato: string;
  };
  instructor: InformeGcPdfInstructorDto;
  periodo: InformeGcPdfPeriodoDto;
  contrato: InformeGcPdfContratoDto;
  coordinador: InformeGcPdfCoordinadorDto | null;
  actividades: InformeGcPdfActividadDto[];
  observaciones: [];
  totales: InformeGcPdfTotalesDto;
  estadisticas: InformeGcPdfEstadisticasDto;
}
