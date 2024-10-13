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

export function openApiSwagger(app: INestApplication, path = '/open-api'): void {
    const swaggerDocumentConfig = new DocumentBuilder()
        .setTitle('VePhim RESTful API Documentations')
        .setContact('lehuygiang28', 'https://giaang.id.vn', 'lehuygiang28@gmail.com')
        .setDescription('Restful Open API for VePhim')
        .setVersion('0.0.1')
        .setLicense('MIT LICENSE', 'https://github.com/lehuygiang28/vphim?tab=MIT-1-ov-file')
        .setExternalDoc('vphim Github', 'https://github.com/lehuygiang28/vphim')
        .addServer('http://localhost:8000', 'localhost')
        .addServer('https://lehuygiang28-vphim-api-wk1.hf.space/', 'staging')
        .addBearerAuth()
        .build();

    const swaggerDocumentOptions: SwaggerDocumentOptions = {
        extraModels: [ProblemDetails],
        include: [MovieModule, ActorModule, CategoryModule, DirectorModule, RegionsModule],
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