export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

export interface Area {
  id_area: number;
  nombre_area: string;
  id_regional?: number;
  tipo?: string;
}

export interface User {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  tipo_documento: string;
  numero_documento: string;
  estado_cuenta: 'pendiente' | 'aprobado' | 'rechazado';
  rol: Rol | null;
  area: Area | null;
  firma_digital_ruta?: string;
  firma_digital_actualizada_at?: string;
}

export interface PeriodoCarga {
  id_periodo: number;
  mes: number;
  anio: number;
  fecha_limite: string;
  habilitado: boolean;
}

export interface Version {
  id_version: number;
  numero_version: number;
  fecha_version: string;
  descripcion?: string;
  archivo_ruta: string;
  archivo_nombre_original: string;
  archivo_tamano_bytes?: number;
  observacion?: string;
  estado: string;
}

export interface Informe {
  id_informe: number;
  tipo_informe: 'GC' | 'GF';
  estado: 'pendiente' | 'validado' | 'devuelto' | 'borrador';
  firmado: boolean;
  fecha_envio?: string;
  observacion?: string;
  periodo: PeriodoCarga;
  usuario: User;
  versiones: Version[];
}

export interface Contrato {
  id_contrato: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  id_usuario: number;
  obligaciones?: Obligacion[];
}

export interface Obligacion {
  id_obligacion: number;
  descripcion: string;
  id_contrato: number;
  actividades?: Actividad[];
}

export interface Actividad {
  id_actividad: number;
  competencia: string;
  resultado: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  fk_gc?: number;
  evidencias?: Evidencia[];
}

export interface Evidencia {
  id_evidencia: number;
  descripcion: string;
  carpeta_obligacion: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_bytes: number;
  fk_actividades: number;
}
