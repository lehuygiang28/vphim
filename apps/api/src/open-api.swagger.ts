import {
    DocumentBuilder,
    SwaggerCustomOptions,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

import { ProblemDetails } from './libs/dtos';
import { ActorModule } from './app/actors';
import { CategoryModule } from './app/categories';
import { DirectorModule } from './app/directors';
import { RegionsModule } from './app/regions';
import { MovieModule } from './app/movies';
import { DashboardModule } from './app/dashboard';

export function openApiSwagger(app: INestApplication, path = '/open-api'): void {
    const swaggerDocumentConfig = new DocumentBuilder()
        .setTitle('VePhim RESTful API Documentations')
        .setContact('admin', 'https://vephim.online', 'admin@vephim.online')
        .setDescription('Restful Open API for VePhim')
        .setVersion('0.0.1')
        .addServer('https://api.vephim.online', 'staging')
        .addServer('http://localhost:8000', 'localhost')
        .addBearerAuth()
        .build();

    const swaggerDocumentOptions: SwaggerDocumentOptions = {
        extraModels: [ProblemDetails],
        include: [
            MovieModule,
            ActorModule,
            CategoryModule,
            DirectorModule,
            RegionsModule,
            DashboardModule,
        ],
    };
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
    SwaggerModule.setup(path, app, document, swaggerCustomOptions);
}
