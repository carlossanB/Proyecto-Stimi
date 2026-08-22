export interface ValidacionDiscrepanciaDto {
  campo: string;
  valorPdf: string;
  valorBD: string;
}

export interface ValidacionNivelDto {
  valido: boolean;
  errores: string[];
}

export interface ValidacionNivelCruceDto {
  valido: boolean;
  discrepancias: ValidacionDiscrepanciaDto[];
}

export interface ResultadoValidacionInformeGcDto {
  esValido: boolean;
  nivel1_estructura: ValidacionNivelDto;
  nivel2_cruceDatos: ValidacionNivelCruceDto;
  nivel3_reglasNegocio: ValidacionNivelDto;
}

export interface ValidarInformeGcDto {
  textoPdf?: string;
  nombreContratista?: string;
  cedulaContratista?: string;
  numeroContrato?: string;
  valorTotalContrato?: string;
  valorPagoMes?: string;
  totalHorasAcademicas?: string;
  periodoMes?: number;
  periodoAnio?: number;
  totalActividadesAdicionales?: string;
}
