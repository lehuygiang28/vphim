import { Body, Controller, Logger, Param, Post } from '@nestjs/common';
import { ApiBody, ApiParam } from '@nestjs/swagger';

import { KKPhimCrawler } from './kkphim.crawler';
import { OphimCrawler } from './ophim.crawler';
import { NguoncCrawler } from './nguonc.crawler';
import { ConfigService } from '@nestjs/config';
import { isNullOrUndefined } from 'apps/api/src/libs/utils/common';

@Controller({ path: 'trigger-crawl' })
export class CrawlController {
    private readonly pw: undefined | string;
    private readonly logger = new Logger(CrawlController.name);
    constructor(
        private readonly kkphim: KKPhimCrawler,
        private readonly ophim: OphimCrawler,
        private readonly nguonc: NguoncCrawler,
        private readonly configService: ConfigService,
    ) {
        if (!isNullOrUndefined(this.configService.get<string>('CRAWLER_PW'))) {
            this.pw = this.configService.getOrThrow<string>('CRAWLER_PW');
            this.logger.log(`Crawler password is configured`);
        }
    }

    @ApiParam({ name: 'slug' })
    @ApiBody({
        schema: {
            properties: {
                pw: { type: 'string' },
            },
        },
    })
    @Post('/:slug')
    triggerCrawler(@Param() { slug }: { slug: string }, @Body() { pw }: { pw: string }) {
        if (isNullOrUndefined(this.pw)) {
            return 'Crawler password not configured';
        }

        this.logger.log(`Triggering crawler for ${slug}: ${pw}`);
        if (pw !== this.pw) {
            return 'Invalid password';
        }

        if (slug === 'kkphim') {
            this.kkphim.crawl();
        } else if (slug === 'ophim') {
            this.ophim.crawl();
        } else if (slug === 'nguonc') {
            this.nguonc.crawl();
        } else {
            return 'Invalid slug';
        }

        return 'OK';
    }
}
