import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable() // Estrategia para verificar el token JWT
export class JwtStrategy extends PassportStrategy(Strategy) { // Hereda la estrategia
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrae el token del encabezado
      ignoreExpiration: false, // No ignora la expiración del token
      secretOrKey: process.env.JWT_SECRET ?? 'sena-secret',
    });
  }

  validate(payload: any) {
    return payload;
  }
}
