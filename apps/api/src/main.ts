import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import * as swaggerStats from 'swagger-stats';

import { AppModule } from './app/app.module';
import { ProblemDetails } from './libs/dtos';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    const configService = app.get(ConfigService);

    const logger = app.get(Logger);
    app.useLogger(logger);

    app.use(helmet());
    app.enableShutdownHooks();

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.PORT || 3000;

    const swaggerDocumentConfig = new DocumentBuilder()
        .setTitle('vphim RESTful API Documentations')
        .setContact('lehuygiang28', 'https://giaang.id.vn', 'lehuygiang28@gmail.com')
        .setDescription('The documentations of the vphim RESTful API')
        .setVersion('0.0.1')
        .setLicense('MIT LICENSE', 'https://github.com/lehuygiang28/vphim?tab=MIT-1-ov-file')
        .setExternalDoc('vphim Github', 'https://github.com/lehuygiang28/vphim')
        .addServer('http://localhost:8000', 'https://vphim.vercel.app')
        .addBearerAuth()
        .build();

    const swaggerDocumentOptions: SwaggerDocumentOptions = { extraModels: [ProblemDetails] };
    const document = SwaggerModule.createDocument(
        app,
        swaggerDocumentConfig,
        swaggerDocumentOptions,
    );
    const swaggerCustomOptions: SwaggerCustomOptions = {
        customSiteTitle: 'vphim RESTful API documentations',
        customCss: new SwaggerTheme().getBuffer(SwaggerThemeNameEnum.NORD_DARK),
        customfavIcon: '/favicon.ico',
    };
    SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

    if (configService.get('API_STATS_PATH')) {
        app.use(
            swaggerStats.getMiddleware({
                uriPath: configService.getOrThrow('API_STATS_PATH'),
                swaggerSpec: document,
                name: 'vphim API statistics',
                timelineBucketDuration: 180000,
                authentication: true,
                async onAuthenticate(req, username, password) {
                    if (
                        username === configService.get('API_STATS_USERNAME') &&
                        password === configService.get('API_STATS_PASSWORD')
                    ) {
                        return true;
                    }

                    return false;
                },
            }),
        );
    }

    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
