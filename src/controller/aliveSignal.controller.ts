import { Controller, Get } from '@nestjs/common';

@Controller('transactions/alive-signal')
export class AliveSignalController {

  @Get('/status')
  getAliveSignal(): { status: string } {
    return { status: 'Service is alive' };
  }
}
