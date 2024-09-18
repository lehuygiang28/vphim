import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class EsState implements OnModuleInit {
    private readonly logger = new Logger(EsState.name);

    constructor(private readonly elasticsearchService: ElasticsearchService) {}

    async onModuleInit() {
        await this.checkElasticsearchConnection();
    }

    private async checkElasticsearchConnection() {
        try {
            const info = await this.elasticsearchService.info();
            this.logger.log('Elasticsearch connection successful:', info);
        } catch (error) {
            this.logger.error('Elasticsearch connection failed:', error);
            this.logger.error(error);
        }
    }
}
