import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule, ElasticsearchService } from '@nestjs/elasticsearch';
import { EsState } from './es-state.service';

@Module({
    imports: [
        ConfigModule.forRoot(),
        ElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                node: configService.getOrThrow('ELASTIC_URL'),
                auth: {
                    username: 'elastic',
                    password: configService.getOrThrow('ELASTIC_PASSWORD'),
                },
            }),
        }),
    ],
    providers: [EsState],
    exports: [SearchModule],
})
export class SearchModule {}
