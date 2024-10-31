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
import compression from 'compression';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import * as swaggerStats from 'swagger-stats';

import { AppModule } from './app/app.module';
import { ProblemDetails } from './libs/dtos';
import { ProblemDetailsFilter } from './libs/filters';
import { isProduction, isTrue } from './libs/utils/common';
import { openApiSwagger } from './open-api.swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    const configService = app.get(ConfigService);

    const logger = app.get(Logger);
    app.useLogger(logger);

    if (isProduction(configService)) {
        app.use(helmet());
    }

    app.enableCors();
    app.enableShutdownHooks();

    if (!isTrue(configService.get('DISABLE_COMPRESS'))) {
        logger.log('Compression is enabled');
        app.use(compression({ level: 9 }));
    }

    app.useGlobalFilters(new ProblemDetailsFilter(logger));

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix, { exclude: ['/', 'ping'] });
    const port = process.env.PORT || 3000;

    const swaggerDocumentConfig = new DocumentBuilder()
        .setTitle('vphim RESTful API Documentations')
        .setDescription('The documentations of the vphim RESTful API')
        .setVersion('0.0.1')
        .addServer('https://api.vephim.online', 'staging')
        .addServer('http://localhost:8000')
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
    SwaggerModule.setup('hidden-vephim-docs', app, document, swaggerCustomOptions);

    openApiSwagger(app, 'docs');

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
