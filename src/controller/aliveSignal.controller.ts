import { Controller, Get, Param, Render } from '@nestjs/common';

@Controller('transactions/alive-signal')
export class AliveSignalController {

  @Get('/status')
  getAliveSignal(): { status: string } {
    return { status: 'Service is alive' };
  }

  @Get()
  @Render('index')
  getHello() {
    return {
      name: 'Juan',
      date: new Date().toLocaleDateString('es-ES')
    };
  }

  @Get('/hello/:name')
  @Render('index')
  getHelloWithParam(@Param('name') name: string) {
    return {
      name: name,
      date: new Date().toLocaleDateString('es-ES')
    };
  }
}
