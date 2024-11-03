import { Controller, Get } from '@nestjs/common';

@Controller({ path: '/' })
export class AppController {
    @Get('/ping')
    async getPing() {
        return 'pong';
    }
}
