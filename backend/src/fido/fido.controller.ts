// src/fido/fido.controller.ts
import { Controller, Post, Body, Param } from '@nestjs/common';
import { FidoService } from './fido.service';

@Controller('fido')
export class FidoController {
  constructor(private readonly fidoService: FidoService) {}

  @Post('register/:userId/options')
  async generateRegistrationOptions(@Param('userId') userId: string) {
    return await this.fidoService.generateRegistrationOptions(userId);
  }

  @Post('register/:userId/verify')
  async verifyRegistration(@Param('userId') userId: string, @Body() body: any) {
    return await this.fidoService.verifyRegistrationResponse(userId, body);
  }

  @Post('authenticate/:userId/options')
  async generateAuthenticationOptions(@Param('userId') userId: string) {
    return await this.fidoService.generateAuthenticationOptions(userId);
  }

  @Post('authenticate/:userId/verify')
  async verifyAuthentication(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    return await this.fidoService.verifyAuthenticationResponse(userId, body);
  }
}
