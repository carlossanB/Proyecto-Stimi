import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-webhook-key'];
    const expectedKey = this.configService.get<string>('WEBHOOK_HENRY_KEY');

    if (!key || key !== expectedKey) {
      throw new UnauthorizedException('Clave de webhook (x-webhook-key) inválida o ausente');
    }
    return true;
  }
}
