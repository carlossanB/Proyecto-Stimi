import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Informe } from './entities/informe.entity';
import { InformeGc } from '../informe-gc/entities/informe-gc.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { Persona } from '../personas/entities/persona.entity';
import { Actividad } from '../actividades/entities/actividade.entity';
import { Evidencia } from '../evidencias/entities/evidencia.entity';
import { PeriodoCarga } from '../periodos-carga/entities/periodo-carga.entity';
import {
  ResultadoValidacionInformeGcDto,
  ValidarInformeGcDto,
} from './dto/informe-gc-validation-result.dto';

@Injectable()
export class InformeGcValidationService {
  constructor(
    @InjectRepository(Informe)
    private readonly informeRepository: Repository<Informe>,
    @InjectRepository(InformeGc)
    private readonly informeGcRepository: Repository<InformeGc>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepository: Repository<Evidencia>,
    @InjectRepository(PeriodoCarga)
    private readonly periodoCargaRepository: Repository<PeriodoCarga>,
  ) {}

  async validar(idInforme: number, payload: ValidarInformeGcDto): Promise<ResultadoValidacionInformeGcDto> {
    const informe = await this.informeRepository.findOne({
      where: { id_informe: idInforme },
      relations: {
        usuario: true,
        periodo: true,
        informeGc: { contrato: true },
      },
    });

    if (!informe) {
      throw new NotFoundException(`Informe #${idInforme} no encontrado`);
    }

    if (informe.tipo_informe !== 'GC' || !informe.informeGc) {
      throw new NotFoundException('El informe no está asociado a un formato GC válido');
    }

    const nivel1 = this.validarNivel1(payload.textoPdf ?? '');
    const nivel2 = await this.validarNivel2(informe, payload);
    const nivel3 = this.validarNivel3(informe, payload);

    return {
      esValido: nivel1.valido && nivel2.valido && nivel3.valido,
      nivel1_estructura: nivel1,
      nivel2_cruceDatos: nivel2,
      nivel3_reglasNegocio: nivel3,
    };
  }

  private validarNivel1(textoPdf: string): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    const texto = (textoPdf || '').toUpperCase();

    const bloques = [
      'PUBLICA',
      'INFORME MENSUAL EJECUCIÓN CONTRACTUAL',
      'VALOR Y FORMA DE PAGO',
      'PLAZO',
      'OBJETO',
      'EJECUCIÓN MENSUAL DE ACTIVIDADES',
      'ACTIVIDADES ACADÉMICAS',
      'EVENTOS DE DIVULGACIÓN TECNOLÓGICA',
      'ACTIVIDADES ADICIONALES',
      'GCCON-F-087 V1',
    ];

    for (const bloque of bloques) {
      if (!texto.includes(bloque)) {
        errores.push(`Falta la sección o elemento: ${bloque}`);
      }
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  private async validarNivel2(
    informe: Informe,
    payload: ValidarInformeGcDto,
  ): Promise<{ valido: boolean; discrepancias: Array<{ campo: string; valorPdf: string; valorBD: string }> }> {
    const discrepancias: Array<{ campo: string; valorPdf: string; valorBD: string }> = [];

    if (payload.nombreContratista && informe.usuario?.nombre_completo) {
      if (payload.nombreContratista.trim().toLowerCase() !== informe.usuario.nombre_completo.trim().toLowerCase()) {
        discrepancias.push({
          campo: 'nombreContratista',
          valorPdf: payload.nombreContratista,
          valorBD: informe.usuario.nombre_completo,
        });
      }
    }

    if (payload.cedulaContratista && informe.usuario?.numero_documento) {
      if (payload.cedulaContratista.trim() !== informe.usuario.numero_documento.trim()) {
        discrepancias.push({
          campo: 'cedulaContratista',
          valorPdf: payload.cedulaContratista,
          valorBD: informe.usuario.numero_documento,
        });
      }
    }

    if (payload.periodoMes && informe.periodo?.mes && payload.periodoMes !== informe.periodo.mes) {
      discrepancias.push({
        campo: 'periodoMes',
        valorPdf: String(payload.periodoMes),
        valorBD: String(informe.periodo.mes),
      });
    }

    if (payload.periodoAnio && informe.periodo?.anio && payload.periodoAnio !== informe.periodo.anio) {
      discrepancias.push({
        campo: 'periodoAnio',
        valorPdf: String(payload.periodoAnio),
        valorBD: String(informe.periodo.anio),
      });
    }

    const actividades = await this.actividadRepository.find({
      where: { informeGc: { id_informe_gc: informe.informeGc?.id_informe_gc } },
      relations: { evidencias: true },
    });

    if (payload.totalHorasAcademicas) {
      const totalHorasPdf = Number(payload.totalHorasAcademicas);
      const totalHorasBd = actividades.reduce((sum, actividad) => sum + Number(actividad.resultado ? 0 : 0), 0);
      if (Number.isNaN(totalHorasPdf) || totalHorasPdf !== totalHorasBd) {
        discrepancias.push({
          campo: 'totalHorasAcademicas',
          valorPdf: payload.totalHorasAcademicas,
          valorBD: String(totalHorasBd),
        });
      }
    }

    return {
      valido: discrepancias.length === 0,
      discrepancias,
    };
  }

  private validarNivel3(informe: Informe, payload: ValidarInformeGcDto): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!informe.informeGc?.contrato) {
      errores.push('El informe no tiene un contrato asociado');
      return { valido: false, errores };
    }

    const contrato = informe.informeGc.contrato;
    const fechaPeriodo = new Date(`${informe.periodo?.anio ?? 2000}-${informe.periodo?.mes ?? 1}-01`);
    const fechaFinContrato = contrato.fecha_fin ? new Date(contrato.fecha_fin) : null;

    if (fechaFinContrato && fechaPeriodo > fechaFinContrato) {
      errores.push('El periodo reportado supera la fecha de fin del contrato');
    }

    if (payload.totalHorasAcademicas && Number(payload.totalHorasAcademicas) <= 0) {
      errores.push('El total de horas académicas debe ser mayor a 0 cuando existe actividad');
    }

    if (informe.estado === 'rechazado') {
      errores.push('El informe fue rechazado previamente y requiere observación de devolución antes de reenviar');
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }
}
