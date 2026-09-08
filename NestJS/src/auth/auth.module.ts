import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PersonasModule } from '../personas/personas.module';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';

@Global()
@Module({
  imports: [
    PersonasModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret-key-12345', // firma del token
        signOptions: { expiresIn: '24h' }, // tiempo de expiración del token
      }),
    }),
  ],
  controllers: [AuthController], // controlador de auth
  providers: [AuthService, JwtStrategy], // proveedores de auth
  exports: [AuthService, JwtModule, PassportModule], // exportación de auth
})
export class AuthModule {}
