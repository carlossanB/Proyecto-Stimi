import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PersonasService } from '../personas/personas.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockPersonasService: { findByEmailOrDocument: jest.Mock };
  let mockJwtService: { sign: jest.Mock };

  beforeEach(async () => {
    mockPersonasService = {
      findByEmailOrDocument: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PersonasService,
          useValue: mockPersonasService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should login with valid credentials', async () => {
    const passwordHash = bcrypt.hashSync('Sena1234', 10);
    mockPersonasService.findByEmailOrDocument.mockResolvedValue({
      id_usuario: 1,
      correo: 'instructor@sena.edu.co',
      contrasena_hash: passwordHash,
      nombre_completo: 'Instructor',
      estado_cuenta: 'aprobado',
      rol: { nombre_rol: 'instructor' },
      area: { nombre_area: 'TI' },
    });

    mockJwtService.sign.mockReturnValue('mock-jwt-token');

    const result = await service.login('instructor@sena.edu.co', 'Sena1234');

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.correo).toBe('instructor@sena.edu.co');
    expect(result.user.rol).toBe('instructor');
  });
});
