import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync } from 'fs';
import { Informe } from './entities/informe.entity';
import { CreateInformeDto } from './dto/create-informe.dto';
import { UpdateInformeDto } from './dto/update-informe.dto';
import { InformeGc } from '../informe-gc/entities/informe-gc.entity';
import { InformeGf } from '../informe-gf/entities/informe-gf.entity';
import { Actividad } from '../actividades/entities/actividade.entity';
import { Evidencia } from '../evidencias/entities/evidencia.entity';
import { InformeGcPdfResponseDto } from './dto/informe-gc-pdf-response.dto';
import { Persona } from '../personas/entities/persona.entity';
import { Version } from '../versiones/entities/version.entity';
import { PeriodoCarga } from '../periodos-carga/entities/periodo-carga.entity';
import { Contrato } from '../contratos/entities/contrato.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { N8nService } from '../n8n/n8n.service';
import { MailService } from '../mail/mail.service';
import { TenantContext } from '../common/tenant/tenant.context';


@Injectable()
export class InformesService {
  private readonly logger = new Logger(InformesService.name);

  constructor(
    @InjectRepository(Informe)
    private readonly informeRepository: Repository<Informe>,
    @InjectRepository(InformeGc)
    private readonly informeGcRepository: Repository<InformeGc>,
    @InjectRepository(InformeGf)
    private readonly informeGfRepository: Repository<InformeGf>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    @InjectRepository(Evidencia)
    private readonly evidenciaRepository: Repository<Evidencia>,
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
    @InjectRepository(PeriodoCarga)
    private readonly periodoCargaRepository: Repository<PeriodoCarga>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Contrato)
    private readonly contratoRepository: Repository<Contrato>,
    private readonly notificacionesService: NotificacionesService,
    private readonly n8nService: N8nService,
    private readonly mailService: MailService,
  ) {}

  // ── MÉTODOS DE INTEGRACIÓN CON EL FRONTEND ──

  async getUserWithArea(userId: number): Promise<Persona> {
    const user = await this.personaRepository.findOne({
      where: { id_usuario: userId },
      relations: { area: true, rol: true },
    });
    if (!user) {
      throw new NotFoundException(`Usuario #${userId} no encontrado`);
    }
    return user;
  }

  async findInstructorReports(idUsuario: number) {
    const tenantId = TenantContext.getTenantId();
    const reports = await this.informeRepository.find({
      where: { usuario: { id_usuario: idUsuario }, tenant_id: tenantId },
      relations: { periodo: true, usuario: true, versiones: true },
      order: {
        periodo: { anio: 'DESC', mes: 'DESC' },
        created_at: 'DESC',
      },
    });

    reports.forEach((report) => {
      if (report.versiones && report.versiones.length > 0) {
        report.versiones.sort((a, b) => b.numero_version - a.numero_version);
        const latest = report.versiones[0];
        if (latest && latest.estado) {
          report.estado = latest.estado;
        }
      }
    });

    return reports;
  }

  async findCoordinatorReports(areaId?: number) {
    const tenantId = TenantContext.getTenantId();
    const qb = this.informeRepository.createQueryBuilder('informe')
      .leftJoinAndSelect('informe.periodo', 'periodo')
      .leftJoinAndSelect('informe.usuario', 'usuario')
      .leftJoinAndSelect('usuario.area', 'area')
      .leftJoinAndSelect('informe.versiones', 'versiones')
      .where('informe.tenant_id = :tenantId', { tenantId });

    if (areaId) {
      qb.andWhere('(area.id_area = :areaId OR area.id_area IS NULL)', { areaId });
    }

    qb.orderBy('periodo.anio', 'DESC')
      .addOrderBy('periodo.mes', 'DESC')
      .addOrderBy('informe.created_at', 'DESC');

    const reports = await qb.getMany();

    reports.forEach((report) => {
      if (report.versiones && report.versiones.length > 0) {
        report.versiones.sort((a, b) => b.numero_version - a.numero_version);
        const latest = report.versiones[0];
        if (latest && latest.estado) {
          report.estado = latest.estado;
        }
      }
    });

    return reports;
  }

  async findHistorial(idUsuario: number, isCoordinator: boolean, areaId?: number) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const tenantId = TenantContext.getTenantId();

    const query = this.informeRepository.createQueryBuilder('informe')
      .leftJoinAndSelect('informe.periodo', 'periodo')
      .leftJoinAndSelect('informe.usuario', 'usuario')
      .leftJoinAndSelect('usuario.area', 'area')
      .leftJoinAndSelect('informe.versiones', 'versiones')
      .where('informe.tenant_id = :tenantId', { tenantId })
      .andWhere('(periodo.anio < :currentYear OR (periodo.anio = :currentYear AND periodo.mes < :currentMonth))', {
        currentYear,
        currentMonth,
      });

    if (!isCoordinator) {
      query.andWhere('usuario.id_usuario = :idUsuario', { idUsuario });
    } else if (areaId) {
      query.andWhere('(area.id_area = :areaId OR area.id_area IS NULL)', { areaId });
    }

    query.orderBy('periodo.anio', 'DESC')
         .addOrderBy('periodo.mes', 'DESC')
         .addOrderBy('versiones.numero_version', 'DESC');

    return query.getMany();
  }

  async getEstadisticas(filtros: { instructorId?: number; mes?: string; areaId?: number }) {
    const tenantId = TenantContext.getTenantId();
    const qb = this.informeRepository.createQueryBuilder('informe')
      .leftJoinAndSelect('informe.usuario', 'usuario')
      .leftJoinAndSelect('usuario.area', 'area')
      .leftJoinAndSelect('informe.periodo', 'periodo')
      .where('informe.tenant_id = :tenantId', { tenantId });

    if (filtros.instructorId) {
      qb.andWhere('usuario.id_usuario = :instructorId', { instructorId: filtros.instructorId });
    }
    
    if (filtros.areaId) {
      qb.andWhere('(area.id_area = :areaId OR area.id_area IS NULL)', { areaId: filtros.areaId });
    }
    
    if (filtros.mes) {
      const { mes, anio } = this.parsePeriod(filtros.mes);
      qb.andWhere('periodo.mes = :mes AND periodo.anio = :anio', { mes, anio });
    }

    const informes = await qb.getMany();

    let aprobados = 0;
    let devueltos = 0;
    let pendientes = 0;
    const cumplimientoPorInstructor: Record<string, any> = {};

    informes.forEach(informe => {
      const isApproved = informe.estado === 'validado' || informe.estado === 'aprobado';
      const isRejected = informe.estado === 'devuelto' || informe.estado === 'rechazado';
      
      if (isApproved) aprobados++;
      else if (isRejected) devueltos++;
      else pendientes++;

      const nombre = informe.usuario.nombre_completo;
      if (!cumplimientoPorInstructor[nombre]) {
        cumplimientoPorInstructor[nombre] = { totales: 0, aprobados: 0, devueltos: 0, pendientes: 0 };
      }
      
      cumplimientoPorInstructor[nombre].totales++;
      if (isApproved) cumplimientoPorInstructor[nombre].aprobados++;
      else if (isRejected) cumplimientoPorInstructor[nombre].devueltos++;
      else cumplimientoPorInstructor[nombre].pendientes++;
    });

    const totales = informes.length;
    const porcentaje_cumplimiento = totales > 0 ? (aprobados / totales) * 100 : 0;

    return {
      metricas: {
        totales,
        aprobados,
        rechazados: devueltos,
        pendientes,
        porcentaje_cumplimiento: parseFloat(porcentaje_cumplimiento.toFixed(2)),
      },
      datasets: {
        cumplimiento_por_instructor: cumplimientoPorInstructor,
        distribucion_estados: {
          Aprobados: aprobados,
          Rechazados: devueltos,
          Pendientes: pendientes,
        }
      }
    };
  }

  async uploadReport(idUsuario: number, file: any, periodoStr: string, tipo: string) {
    const user = await this.getUserWithArea(idUsuario);
    const periodo = await this.findOrCreatePeriodo(periodoStr);
    const tipoInforme = tipo.toUpperCase();

    // Check if report already exists
    let informe = await this.informeRepository.findOne({
      where: {
        usuario: { id_usuario: idUsuario },
        periodo: { id_periodo: periodo.id_periodo },
        tipo_informe: tipoInforme,
      },
      relations: { versiones: true },
    });

    if (informe) {
      // If the report is already validated, block any new upload
      if (informe.estado === 'validado') {
        throw new BadRequestException(
          `El informe ${tipoInforme} del período ${periodoStr} ya fue validado y no puede recibir nuevas versiones.`,
        );
      }
      // If it exists but not validated, treat it as uploading a new version
      return this.uploadNuevaVersion(idUsuario, file, periodoStr, tipo);
    }

    // Create new Informe
    informe = this.informeRepository.create({
      usuario: user,
      periodo: periodo,
      tipo_informe: tipoInforme,
      estado: 'pendiente',
      firmado: false,
    });
    await this.informeRepository.save(informe);

    // Create sub-table record based on type
    if (tipoInforme === 'GC') {
      let contrato = await this.contratoRepository.findOne({
        where: { usuario: { id_usuario: idUsuario }, estado: 'activo' },
      });
      if (!contrato) {
        contrato = this.contratoRepository.create({
          usuario: user,
          fecha_inicio: new Date(new Date().getFullYear(), 0, 1),
          fecha_fin: new Date(new Date().getFullYear(), 11, 31),
          estado: 'activo',
        });
        await this.contratoRepository.save(contrato);
      }

      const informeGc = this.informeGcRepository.create({
        informe,
        contrato,
        version_formato: 'GTH-F-062 V10',
      });
      await this.informeGcRepository.save(informeGc);
    } else {
      const informeGf = this.informeGfRepository.create({
        informe,
        version_formato: 'GF-F-001 V2',
        valor_total: 0,
      });
      await this.informeGfRepository.save(informeGf);
    }

    // Create version 1
    const version = this.versionRepository.create({
      informe,
      numero_version: 1,
      archivo_ruta: file.path.replace(/\\/g, '/'),
      archivo_nombre_original: file.originalname,
      archivo_tamano_bytes: file.size,
      estado: 'borrador',
    });
    await this.versionRepository.save(version);

    // Set report status to 'borrador' avoiding cascade validation issues
    await this.informeRepository.update({ id_informe: informe.id_informe }, { estado: 'borrador' });

    this.n8nService.notifyAction('informe_cargado', {
      id_informe: informe.id_informe,
      tipo_informe: tipo,
      periodo: periodoStr,
      id_usuario: idUsuario,
      version: 1,
    });

    // Reload and return
    return this.informeRepository.findOne({
      where: { id_informe: informe.id_informe },
      relations: { periodo: true, usuario: true, versiones: true },
    });
  }

  async uploadNuevaVersion(idUsuario: number, file: any, periodoStr: string, tipo: string) {
    const periodo = await this.findOrCreatePeriodo(periodoStr);
    const tipoInforme = tipo.toUpperCase();

    const informe = await this.informeRepository.findOne({
      where: {
        usuario: { id_usuario: idUsuario },
        periodo: { id_periodo: periodo.id_periodo },
        tipo_informe: tipoInforme,
      },
      relations: { versiones: true },
    });

    if (!informe) {
      // If it doesn't exist, create it from scratch
      return this.uploadReport(idUsuario, file, periodoStr, tipo);
    }

    // Check highest (latest) version status if versions exist
    if (informe.versiones && informe.versiones.length > 0) {
      const highestVersionObj = informe.versiones.reduce((max, v) => v.numero_version > max.numero_version ? v : max, informe.versiones[0]);
      if (highestVersionObj && (highestVersionObj.estado === 'validado' || highestVersionObj.estado === 'aprobado')) {
        throw new BadRequestException(
          `El informe ${tipoInforme} del período ${periodoStr} ya fue validado en su versión más reciente (V${highestVersionObj.numero_version}) y no puede recibir nuevas versiones.`,
        );
      }
    } else if (informe.estado === 'validado') {
      throw new BadRequestException(
        `El informe ${tipoInforme} del período ${periodoStr} ya fue validado y no puede recibir nuevas versiones.`,
      );
    }

    // Determine new version number
    let nextVersionNumber = 1;
    if (informe.versiones && informe.versiones.length > 0) {
      const highestVersion = Math.max(...informe.versiones.map(v => v.numero_version));
      nextVersionNumber = highestVersion + 1;
    }

    // Create the new version record
    const version = this.versionRepository.create({
      informe: { id_informe: informe.id_informe } as any,
      numero_version: nextVersionNumber,
      archivo_ruta: file.path.replace(/\\/g, '/'),
      archivo_nombre_original: file.originalname,
      archivo_tamano_bytes: file.size,
      estado: 'borrador',
    });
    await this.versionRepository.save(version);

    // Reset report state to borrador and clear old observations using update to avoid cascade issues
    await this.informeRepository.update(
      { id_informe: informe.id_informe },
      { estado: 'borrador', observacion: null as any }
    );

    this.n8nService.notifyAction('informe_cargado', {
      id_informe: informe.id_informe,
      tipo_informe: tipo,
      periodo: periodoStr,
      id_usuario: idUsuario,
      version: nextVersionNumber,
    });

    return this.informeRepository.findOne({
      where: { id_informe: informe.id_informe },
      relations: { periodo: true, usuario: true, versiones: true },
    });
  }

  async getDetalleReporte(idUsuario: number, periodoStr: string, tipo: string, isCoordinator: boolean) {
    const periodo = await this.findOrCreatePeriodo(periodoStr);
    const tipoInforme = tipo.toUpperCase();

    const whereClause: any = {
      periodo: { id_periodo: periodo.id_periodo },
      tipo_informe: tipoInforme,
    };

    if (!isCoordinator) {
      whereClause.usuario = { id_usuario: idUsuario };
    }

    const report = await this.informeRepository.findOne({
      where: whereClause,
      relations: {
        usuario: { area: true, rol: true },
        periodo: true,
        versiones: true,
      },
    });

    if (!report) {
      return {
        id_informe: null,
        estado: 'No cargado',
        periodo: {
          id_periodo: periodo.id_periodo,
          mes: periodo.mes,
          anio: periodo.anio,
          nombre: periodoStr,
        },
        tipo_informe: tipoInforme,
        versiones: [],
      };
    }

    // Sort versions by version number desc
    if (report.versiones) {
      report.versiones.sort((a, b) => b.numero_version - a.numero_version);
    }

    return report;
  }

  async cambiarEstadoReporte(
    periodoStr: string,
    tipo: string,
    estado: string,
    observacion?: string,
    idUsuario?: number,
  ) {
    const periodo = await this.findOrCreatePeriodo(periodoStr);
    const tipoInforme = tipo.toUpperCase();

    const whereClause: any = {
      periodo: { id_periodo: periodo.id_periodo },
      tipo_informe: tipoInforme,
    };

    if (idUsuario) {
      whereClause.usuario = { id_usuario: idUsuario };
    }

    const report = await this.informeRepository.findOne({
      where: whereClause,
      relations: { versiones: true, usuario: true, periodo: true },
    });

    if (!report) {
      // ── UPSERT: crear el informe si no existe (bot puede registrarlo directamente) ──
      if (!idUsuario) {
        throw new NotFoundException(`Informe de tipo ${tipoInforme} para el periodo ${periodoStr} no encontrado`);
      }
      const persona = await this.personaRepository.findOne({
        where: { id_usuario: idUsuario },
        relations: { area: true, rol: true },
      });
      if (!persona) {
        throw new NotFoundException(`Usuario con id ${idUsuario} no encontrado`);
      }
      const newInforme = this.informeRepository.create({
        usuario: persona,
        periodo: periodo,
        tipo_informe: tipoInforme,
        estado: 'pendiente',
        firmado: false,
      });
      const saved = await this.informeRepository.save(newInforme);

      // Crear sub-tabla GC o GF
      if (tipoInforme === 'GC') {
        let contrato = await this.contratoRepository.findOne({
          where: { usuario: { id_usuario: idUsuario }, estado: 'activo' },
        });
        if (!contrato) {
          contrato = this.contratoRepository.create({
            usuario: persona,
            fecha_inicio: new Date(new Date().getFullYear(), 0, 1),
            fecha_fin: new Date(new Date().getFullYear(), 11, 31),
            estado: 'activo',
          });
          await this.contratoRepository.save(contrato);
        }
        await this.informeGcRepository.save(
          this.informeGcRepository.create({ informe: saved, contrato, version_formato: 'GTH-F-062 V10' }),
        );
      } else {
        await this.informeGfRepository.save(
          this.informeGfRepository.create({ informe: saved, version_formato: 'GF-F-001 V2', valor_total: 0 }),
        );
      }

      // Re-fetch with relations so the rest of the method can continue normally
      const newReport = await this.informeRepository.findOne({
        where: { id_informe: saved.id_informe },
        relations: { versiones: true, usuario: true, periodo: true },
      });
      // Fall through: the code below will update estado/observacion on newReport
      return this.updateInformeEstado(newReport!, estado, observacion, periodoStr);
    }

    // Delegate to shared helper
    return this.updateInformeEstado(report, estado, observacion, periodoStr);
  }

  private async updateInformeEstado(
    report: Informe,
    estado: string,
    observacion: string | undefined,
    periodoStr: string,
  ) {
    // Map state strings to match database standard
    let mappedEstado = estado.toLowerCase();
    if (mappedEstado === 'aprobado' || mappedEstado === 'validado') {
      mappedEstado = 'validado';
    } else if (mappedEstado === 'rechazado' || mappedEstado === 'devuelto') {
      mappedEstado = 'devuelto';
    } else if (mappedEstado === 'borrador') {
      mappedEstado = 'borrador';
    } else {
      mappedEstado = 'pendiente';
    }

    report.estado = mappedEstado;
    report.observacion = observacion || undefined;
    await this.informeRepository.save(report);

    // Sync latest version
    if (report.versiones && report.versiones.length > 0) {
      report.versiones.sort((a, b) => b.numero_version - a.numero_version);
      const latestVersion = report.versiones[0];
      latestVersion.estado = mappedEstado;
      latestVersion.observacion = observacion || undefined;
      await this.versionRepository.save(latestVersion);
    }

    // ── Enviar correo de notificación al instructor al aprobar (validado) o devolver un informe ──
    if (mappedEstado === 'validado' || mappedEstado === 'devuelto') {
      try {
        let instructor = report.usuario;
        if (!instructor || !instructor.correo) {
          const userId = report.usuario?.id_usuario;
          if (userId) {
            instructor = (await this.personaRepository.findOne({ where: { id_usuario: userId } })) as Persona;
          }
        }

        if (instructor && instructor.correo) {
          await this.mailService.sendReportStatusEmail(
            instructor.correo,
            instructor.nombre_completo,
            report.tipo_informe,
            periodoStr,
            mappedEstado,
            observacion,
          );
        } else {
          this.logger.warn(
            `No se pudo enviar correo de estado de informe: Correo de instructor no encontrado para el usuario ID ${report.usuario?.id_usuario}`,
          );
        }
      } catch (mailErr: any) {
        this.logger.error(
          `Error al enviar correo de estado de informe a ${report.usuario?.correo || 'instructor'}: ${mailErr?.message || mailErr}`,
          mailErr?.stack,
        );
      }
    }

    // Disparar notificación automática al propietario del informe (respetando sus preferencias)
    if (report.usuario) {
      const typeMap: Record<string, string> = {
        'validado': 'success',
        'devuelto': 'error',
        'borrador': 'info',
        'pendiente': 'warning',
      };
      const cleanType = typeMap[mappedEstado] || 'info';

      // Leer preferencias del usuario y verificar si este tipo de notificación está habilitado
      const prefs: Record<string, unknown> = (report.usuario as any).preferencias_notificaciones ?? {};
      const flagMap: Record<string, string> = {
        'validado': 'notif_aprobacion',
        'devuelto': 'notif_aprobacion',
        'pendiente': 'notif_nuevos',
        'borrador': 'notif_pendientes',
      };
      const prefKey = flagMap[mappedEstado];
      // Only skip if the preference is explicitly set to false
      const notifHabilitada = prefKey ? prefs[prefKey] !== false : true;

      if (notifHabilitada) {
        let message = `El estado de su informe ${report.tipo_informe} del período ${periodoStr} ha cambiado a: "${mappedEstado.toUpperCase()}"`;
        if (observacion) {
          message += `. Observación: "${observacion}"`;
        }
        await this.notificacionesService.crear(
          report.usuario.id_usuario,
          message,
          cleanType as any,
          false // El correo ya fue enviado arriba mediante sendReportStatusEmail
        );
      }
    }

    this.n8nService.notifyAction('estado_cambiado', {
      id_informe: report.id_informe,
      tipo_informe: report.tipo_informe,
      periodo: periodoStr,
      id_usuario: report.usuario.id_usuario,
      estado: mappedEstado,
      observacion: observacion || null,
    });

    return this.informeRepository.findOne({
      where: { id_informe: report.id_informe },
      relations: { periodo: true, usuario: true, versiones: true },
    });
  }


  async deleteLastVersion(id: number) {
    const report = await this.informeRepository.findOne({
      where: { id_informe: id },
      relations: { versiones: true },
    });

    if (!report) {
      throw new NotFoundException(`Informe #${id} no encontrado`);
    }

    if (!report.versiones || report.versiones.length === 0) {
      throw new BadRequestException(`El informe #${id} no tiene ninguna versión para eliminar`);
    }

    // Sort versions to find the latest
    report.versiones.sort((a, b) => b.numero_version - a.numero_version);
    const latestVersion = report.versiones[0];

    // 1. Delete physical file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), latestVersion.archivo_ruta);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`>>> [DEBUG-BACKEND] Archivo físico eliminado: ${filePath}`);
      } else {
        console.warn(`>>> [DEBUG-BACKEND] Archivo físico no encontrado al eliminar: ${filePath}`);
      }
    } catch (err: any) {
      console.error(`>>> [DEBUG-BACKEND] Error al eliminar archivo físico:`, err);
    }

    // 2. Delete version record from database
    await this.versionRepository.remove(latestVersion);
    console.log(`>>> [DEBUG-BACKEND] Registro de versión V${latestVersion.numero_version} eliminado.`);

    // 3. Update report state
    const remainingVersions = report.versiones.filter(v => v.id_version !== latestVersion.id_version);
    if (remainingVersions.length > 0) {
      // Re-sort remaining to find the new latest version
      remainingVersions.sort((a, b) => b.numero_version - a.numero_version);
      const newLatest = remainingVersions[0];
      report.estado = newLatest.estado;
      report.observacion = newLatest.observacion || undefined;
      await this.informeRepository.save(report);
    } else {
      // No versions left, delete the report completely (so instructor can start from scratch)
      // Since cascade details could vary, we can delete GC/GF children first
      await this.informeGcRepository.delete({ informe: { id_informe: report.id_informe } });
      await this.informeGfRepository.delete({ informe: { id_informe: report.id_informe } });
      await this.informeRepository.remove(report);
      console.log(`>>> [DEBUG-BACKEND] Informe #${id} eliminado completo por no tener versiones.`);
      return { id_informe: null, estado: 'No cargado', versiones: [] };
    }

    return this.informeRepository.findOne({
      where: { id_informe: report.id_informe },
      relations: { periodo: true, usuario: true, versiones: true },
    });
  }

  // ── MÉTODOS AUXILIARES ──

  private parsePeriod(periodoStr: string): { mes: number; anio: number } {
    const trimmed = decodeURIComponent(periodoStr).trim();
    const regex = /([a-zA-ZáéíóúÁÉÍÓÚ]+)[-\s]+(\d{4})/;
    const match = trimmed.match(regex);
    if (!match) {
      throw new BadRequestException('Formato de periodo inválido. Use "Mes Año" (ej: "Julio 2026")');
    }
    const mesStr = match[1].toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
    const anio = parseInt(match[2]);

    const mesesMap: Record<string, number> = {
      // Nombres completos
      enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
      julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
      // Abreviaturas de 3 letras (como las usa n8n con los nombres de archivo)
      ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
      jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
    };


    const mes = mesesMap[mesStr];
    if (!mes) {
      throw new BadRequestException(`Mes inválido: ${match[1]}`);
    }

    return { mes, anio };
  }

  private async findOrCreatePeriodo(periodoStr: string): Promise<PeriodoCarga> {
    const { mes, anio } = this.parsePeriod(periodoStr);
    let periodo = await this.periodoCargaRepository.findOne({
      where: { mes, anio },
    });

    if (!periodo) {
      const limitDate = new Date(anio, mes, 0); // last day of month
      periodo = this.periodoCargaRepository.create({
        mes,
        anio,
        fecha_limite: limitDate,
        habilitado: true,
      });
      await this.periodoCargaRepository.save(periodo);
    }

    return periodo;
  }

  // ── MÉTODOS ORIGINALES (MANTENIDOS PARA COMPATIBILIDAD) ──

  async create(createInformeDto: CreateInformeDto) {
    const informe = this.informeRepository.create(createInformeDto);
    return this.informeRepository.save(informe);
  }

  findAll() {
    return this.informeRepository.find({ relations: { usuario: true, periodo: true } });
  }

  findOne(id: number) {
    return this.informeRepository.findOne({
      where: { id_informe: id },
      relations: { usuario: true, periodo: true },
    });
  }

  update(id: number, updateInformeDto: UpdateInformeDto) {
    return this.informeRepository.update(id, updateInformeDto);
  }
  remove(id: number) {
    return this.informeRepository.softDelete(id);
  }

  async getDatosPdfGc(id: number): Promise<InformeGcPdfResponseDto> {
    const informe = await this.informeRepository.findOne({
      where: { id_informe: id },
      relations: {
        usuario: { area: true, rol: true },
        periodo: true,
        informeGc: { contrato: { obligaciones: true, usuario: true }, actividades: { evidencias: true } },
      },
    });

    if (!informe) {
      throw new NotFoundException(`Informe #${id} no encontrado`);
    }

    if (informe.tipo_informe !== 'GC' || !informe.informeGc) {
      throw new BadRequestException('El informe no está asociado a un formato GC válido');
    }

    const actividades = informe.informeGc.actividades ?? [];
    const totalEvidencias = actividades.reduce((sum, actividad) => sum + (actividad.evidencias?.length ?? 0), 0);
    const actividadesPorCompetencia = actividades.reduce<Record<string, number>>((acc, actividad) => {
      acc[actividad.competencia] = (acc[actividad.competencia] ?? 0) + 1;
      return acc;
    }, {});

    const coordinador = informe.usuario.aprobado_por_id
      ? await this.informeRepository.manager.getRepository(Persona).findOne({
          where: { id_usuario: informe.usuario.aprobado_por_id },
          relations: { area: true, rol: true },
        })
      : null;

    const response: InformeGcPdfResponseDto = {
      informe: {
        id_informe: informe.id_informe,
        tipo_informe: informe.tipo_informe,
        estado: informe.estado,
        firmado: informe.firmado,
        pendiente_sincronizacion: informe.pendiente_sincronizacion,
        fecha_envio: informe.fecha_envio ? informe.fecha_envio.toISOString() : null,
        version_formato: informe.informeGc.version_formato,
      },
      instructor: {
        id_usuario: informe.usuario.id_usuario,
        nombre_completo: informe.usuario.nombre_completo,
        tipo_documento: informe.usuario.tipo_documento,
        numero_documento: informe.usuario.numero_documento,
        correo: informe.usuario.correo,
        area: {
          id_area: informe.usuario.area?.id_area ?? 0,
          nombre_area: informe.usuario.area?.nombre_area ?? '',
        },
        rol: {
          id_rol: informe.usuario.rol?.id_rol ?? 0,
          nombre_rol: informe.usuario.rol?.nombre_rol ?? '',
        },
        firma_digital_ruta: informe.usuario.firma_digital_ruta ?? null,
      },
      periodo: {
        id_periodo: informe.periodo.id_periodo,
        anio: informe.periodo.anio,
        mes: informe.periodo.mes,
      },
      contrato: {
        id_contrato: informe.informeGc.contrato.id_contrato,
        fecha_inicio: informe.informeGc.contrato.fecha_inicio.toISOString().slice(0, 10),
        fecha_fin: informe.informeGc.contrato.fecha_fin.toISOString().slice(0, 10),
        estado: informe.informeGc.contrato.estado,
        obligaciones: (informe.informeGc.contrato.obligaciones ?? []).map((obligacion) => ({
          id_obligacion: obligacion.id_obligacion,
          descripcion: obligacion.descripcion,
        })),
      },
      coordinador: coordinador
        ? {
            id_usuario: coordinador.id_usuario,
            nombre_completo: coordinador.nombre_completo,
            correo: coordinador.correo,
            area: coordinador.area ? { id_area: coordinador.area.id_area, nombre_area: coordinador.area.nombre_area } : null,
            rol: coordinador.rol ? { id_rol: coordinador.rol.id_rol, nombre_rol: coordinador.rol.nombre_rol } : null,
          }
        : null,
      actividades: actividades.map((actividad) => ({
        id_actividad: actividad.id_actividad,
        fecha_inicio: actividad.fecha_inicio.toISOString().slice(0, 10),
        fecha_fin: actividad.fecha_fin.toISOString().slice(0, 10),
        competencia: actividad.competencia,
        resultado: actividad.resultado,
        estado: actividad.estado,
        evidencias: (actividad.evidencias ?? []).map((evidencia) => ({
          id_evidencia: evidencia.id_evidencia,
          descripcion: evidencia.descripcion,
          carpeta_obligacion: evidencia.carpeta_obligacion,
          ruta_archivo: evidencia.ruta_archivo,
          tipo_archivo: evidencia.tipo_archivo,
          tamano_bytes: evidencia.tamano_bytes,
        })),
      })),
      observaciones: [],
      totales: {
        total_actividades: actividades.length,
        total_evidencias: totalEvidencias,
      },
      estadisticas: {
        actividades_por_competencia: actividadesPorCompetencia,
      },
    };

    return response;
  }

  async getReportFile(id: number) {
    const report = await this.informeRepository.findOne({
      where: { id_informe: id },
      relations: { versiones: true },
    });

    if (!report) {
      throw new NotFoundException(`Informe #${id} no encontrado`);
    }

    if (!report.versiones || report.versiones.length === 0) {
      throw new NotFoundException(`El informe #${id} no tiene archivos cargados`);
    }

    // Get the latest version
    report.versiones.sort((a, b) => b.numero_version - a.numero_version);
    const latest = report.versiones[0];

    const filePath = join(process.cwd(), latest.archivo_ruta);
    if (!existsSync(filePath)) {
      throw new NotFoundException('El archivo físico no existe en el servidor');
    }

    return {
      path: filePath,
      name: latest.archivo_nombre_original,
    };
  }
}