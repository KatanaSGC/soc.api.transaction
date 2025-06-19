import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

@Controller('transactions/alive-signal')
export class AliveSignalController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('/status')
  getAliveSignal(): { status: string } {
    return { status: 'Service is alive' };
  }
}
