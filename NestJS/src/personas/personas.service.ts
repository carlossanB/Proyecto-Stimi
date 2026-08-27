import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Persona } from './entities/persona.entity';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { MailService } from '../mail/mail.service';
import { TenantContext } from '../common/tenant/tenant.context';

@Injectable()
export class PersonasService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    private readonly mailService: MailService,
  ) {}

  async create(createPersonaDto: CreatePersonaDto) {
    const email = createPersonaDto.email.trim().toLowerCase();
    const numeroDocumento = createPersonaDto.numeroDocumento.trim();
    const tipoDocumento = createPersonaDto.tipoDocumento.trim().toUpperCase();

    const emailExistente = await this.personaRepository.findOne({
      where: { correo: email },
    });

    if (emailExistente) {
      throw new ConflictException('Ya existe una cuenta registrada con este email.');
    }

    const documentoExistente = await this.personaRepository.findOne({
      where: { numero_documento: numeroDocumento },
    });

    if (documentoExistente) {
      throw new ConflictException(
        'Ya existe una persona registrada con este número de documento.',
      );
    }

    const contrasenaHash = await bcrypt.hash(createPersonaDto.contrasena, 10);

    const persona = this.personaRepository.create({
      nombre_completo: createPersonaDto.nombreCompleto.trim(),
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      correo: email,
      contrasena_hash: contrasenaHash,
      rol: null,
      area: null,
      estado_cuenta: 'pendiente',
      tenant_id: TenantContext.getTenantId(),
      regional: createPersonaDto.regional?.trim() || null,
      sede_centro: createPersonaDto.sedeCentro?.trim() || null,
    });

    await this.personaRepository.save(persona);

    return persona;
  }

  async findByEmailOrDocument(identifier: string): Promise<Persona | null> {
    const trimmed = identifier.trim().toLowerCase();
    const tenantId = TenantContext.getTenantId();
    return this.personaRepository.findOne({
      where: [
        { correo: trimmed, tenant_id: tenantId },
        { numero_documento: identifier.trim(), tenant_id: tenantId },
      ],
      relations: { area: true, rol: true },
    });
  }

  async findByEmail(email: string): Promise<Persona | null> {
    return this.personaRepository.findOne({
      where: { correo: email.trim().toLowerCase(), tenant_id: TenantContext.getTenantId() },
      relations: { area: true, rol: true },
    });
  }


  findAll() {
    return this.personaRepository.find({
      where: { tenant_id: TenantContext.getTenantId() },
      relations: { area: true, rol: true },
    });
  }

  async findOne(id: number) {
    const persona = await this.personaRepository.findOne({
      where: { id_usuario: id, tenant_id: TenantContext.getTenantId() },
      relations: { area: true, rol: true },
    });
    if (!persona) {
      throw new NotFoundException(`Usuario #${id} no encontrado`);
    }
    return persona;
  }

  async update(id: number, updatePersonaDto: UpdatePersonaDto) {
    const persona = await this.findOne(id);
    const previousState = persona.estado_cuenta;

    if (updatePersonaDto.nombreCompleto !== undefined) {
      persona.nombre_completo = updatePersonaDto.nombreCompleto.trim();
    }
    if (updatePersonaDto.email !== undefined) {
      persona.correo = updatePersonaDto.email.trim().toLowerCase();
    }
    if (updatePersonaDto.tipoDocumento !== undefined) {
      persona.tipo_documento = updatePersonaDto.tipoDocumento.trim().toUpperCase();
    }
    if (updatePersonaDto.numeroDocumento !== undefined) {
      persona.numero_documento = updatePersonaDto.numeroDocumento.trim();
    }
    if (updatePersonaDto.contrasena !== undefined) {
      persona.contrasena_hash = await bcrypt.hash(updatePersonaDto.contrasena, 10);
    }
    if (updatePersonaDto.estado_cuenta !== undefined) {
      persona.estado_cuenta = updatePersonaDto.estado_cuenta;
      if (updatePersonaDto.estado_cuenta === 'aprobado') {
        persona.fecha_aprobacion = new Date();
      }
    }
    if (updatePersonaDto.motivo_rechazo !== undefined) {
      persona.motivo_rechazo = updatePersonaDto.motivo_rechazo;
    }
    if (updatePersonaDto.carpeta_drive_url !== undefined) {
      persona.carpeta_drive_url = updatePersonaDto.carpeta_drive_url;
    }
    if (updatePersonaDto.id_rol !== undefined) {
      persona.rol = updatePersonaDto.id_rol ? ({ id_rol: updatePersonaDto.id_rol } as any) : null;
    }
    if (updatePersonaDto.id_area !== undefined) {
      persona.area = updatePersonaDto.id_area ? ({ id_area: updatePersonaDto.id_area } as any) : null;
    }
    if (updatePersonaDto.regional !== undefined) {
      persona.regional = updatePersonaDto.regional?.trim() || undefined;
    }
    if (updatePersonaDto.sedeCentro !== undefined) {
      persona.sede_centro = updatePersonaDto.sedeCentro?.trim() || undefined;
    }

    const saved = await this.personaRepository.save(persona);

    // Enviar correo si el estado de cuenta cambió a aprobado o rechazado
    if (updatePersonaDto.estado_cuenta === 'aprobado' && previousState !== 'aprobado') {
      this.mailService
        .sendAccountApprovedEmail(saved.correo, saved.nombre_completo)
        .catch(() => {});
    } else if (updatePersonaDto.estado_cuenta === 'rechazado' && previousState !== 'rechazado') {
      this.mailService
        .sendAccountRejectedEmail(saved.correo, saved.nombre_completo, saved.motivo_rechazo)
        .catch(() => {});
    }

    return saved;
  }

  remove(id: number) {
    return this.personaRepository.softDelete(id);
  }

  async saveResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await this.personaRepository.update(userId, {
      reset_token: token,
      reset_token_expiry: expiry,
    } as any);
  }

  async findByResetToken(token: string): Promise<Persona | null> {
    return this.personaRepository.findOne({
      where: { reset_token: token },
      relations: { area: true, rol: true },
    });
  }

  async clearResetToken(userId: number): Promise<void> {
    await this.personaRepository.update(userId, {
      reset_token: null,
      reset_token_expiry: null,
    } as any);
  }

  // ── Preferencias de notificación ────────────────────────────────────────────
  /** Devuelve las preferencias de notificación del usuario */
  async getSettings(userId: number): Promise<Record<string, unknown>> {
    const persona = await this.findOne(userId);
    return persona.preferencias_notificaciones ?? {};
  }

  /** Actualiza (merge) las preferencias de notificación del usuario */
  async updateSettings(userId: number, prefs: Record<string, unknown>): Promise<Record<string, unknown>> {
    const persona = await this.findOne(userId);
    const merged = { ...(persona.preferencias_notificaciones ?? {}), ...prefs };
    persona.preferencias_notificaciones = merged;
    await this.personaRepository.save(persona);
    return merged;
  }
  // ────────────────────────────────────────────────────────────────────────────

  // ── Firma Digital Base64 ─────────────────────────────────────────────────────
  /**
   * Decodifica una imagen en base64 y la guarda como .png en uploads/firmas/.
   * Actualiza firma_digital_ruta y firma_digital_actualizada_at del usuario.
   */
  async saveSignatureBase64(userId: number, base64Data: string): Promise<string> {
    // Eliminar el prefijo "data:image/png;base64," si viene incluido
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    // Construir la ruta del archivo
    const { join } = await import('path');
    const { existsSync, mkdirSync, writeFileSync } = await import('fs');
    const signaturesDir = join(process.cwd(), 'uploads', 'firmas');
    if (!existsSync(signaturesDir)) {
      mkdirSync(signaturesDir, { recursive: true });
    }
    const fileName = `firma_${userId}_${Date.now()}.png`;
    const filePath = join(signaturesDir, fileName);
    writeFileSync(filePath, buffer);

    const relativePath = `uploads/firmas/${fileName}`;

    // Actualizar en BD
    const persona = await this.findOne(userId);
    persona.firma_digital_ruta = relativePath;
    persona.firma_digital_actualizada_at = new Date();
    await this.personaRepository.save(persona);

    return relativePath;
  }
  // ────────────────────────────────────────────────────────────────────────────
}