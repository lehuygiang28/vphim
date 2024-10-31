import { Controller, Get } from '@nestjs/common';

@Controller({ path: '/' })
export class AppController {
    @Get('/')
    async getRoot() {
        return {
            message: 'VePhim Api - Go to /docs for more information',
            time: new Date().getTime(),
        };
    }

    @Get('/ping')
    async getPing() {
        return 'pong';
    }
}
