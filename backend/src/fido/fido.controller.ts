// src/fido/fido.controller.ts
import { Controller, Post, Body, Param } from '@nestjs/common';
import { FidoService } from './fido.service';

@Controller('fido')
export class FidoController {
  constructor(private readonly fidoService: FidoService) {}

  @Post('register/:userId/options')
  async generateRegistrationOptions(@Param('userId') userId: string) {
    const options = await this.fidoService.generateRegistrationOptions(userId);
    return options;
  }

  @Post('register/:userId/verify')
  async verifyRegistration(@Param('userId') userId: string, @Body() body: any) {
    const success = await this.fidoService.verifyRegistrationResponse(
      userId,
      body,
    );
    return { success };
  }

  @Post('authenticate/:userId/options')
  async generateAuthenticationOptions(@Param('userId') userId: string) {
    const options =
      await this.fidoService.generateAuthenticationOptions(userId);
    return options;
  }

  @Post('authenticate/:userId/verify')
  async verifyAuthentication(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    const data = await this.fidoService.verifyAuthenticationResponse(
      userId,
      body,
    );
    if (typeof data !== 'boolean') {
      return { success: false, error: data };
    } else {
      return { success: false };
    }
  }
}
