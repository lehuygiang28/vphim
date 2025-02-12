import { Body, Controller, Logger, Param, Post } from '@nestjs/common';
import { ApiBody, ApiExcludeController, ApiParam } from '@nestjs/swagger';

import { KKPhimCrawler } from './kkphim.crawler';
import { OphimCrawler } from './ophim.crawler';
import { NguoncCrawler } from './nguonc.crawler';
import { ConfigService } from '@nestjs/config';
import { isNullOrUndefined, isTrue } from 'apps/api/src/libs/utils/common';
import { SearchService } from '../search.service';

@ApiExcludeController()
@Controller({ path: 'trigger-crawl' })
export class CrawlController {
    private readonly pw: undefined | string;
    private readonly logger = new Logger(CrawlController.name);
    constructor(
        private readonly kkphim: KKPhimCrawler,
        private readonly ophim: OphimCrawler,
        private readonly nguonc: NguoncCrawler,
        private readonly configService: ConfigService,
        private readonly searchService: SearchService,
    ) {
        if (!isNullOrUndefined(this.configService.get<string>('CRAWLER_PW'))) {
            this.pw = this.configService.getOrThrow<string>('CRAWLER_PW');
            this.logger.log(`Crawler password is configured`);
        }
    }
    @ApiBody({
        schema: {
            properties: {
                pw: { type: 'string' },
                clear: { type: 'string' },
            },
        },
    })
    @Post('/re-index')
    async reIndex(@Body() { pw, clear = 'false' }: { pw: string; clear?: string }) {
        if (isNullOrUndefined(this.pw)) {
            return 'Crawler password not configured';
        }

        if (pw !== this.pw) {
            return 'Invalid password';
        }

        this.logger.log(`Re-indexing crawler`);
        await this.searchService.indexAllMovies(isTrue(clear));

        return 'OK';
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

        if (pw !== this.pw) {
            return 'Invalid password';
        }

        if (slug === 'kkphim') {
            this.kkphim.triggerCrawl();
        } else if (slug === 'ophim') {
            this.ophim.triggerCrawl();
        } else if (slug === 'nguonc') {
            this.nguonc.triggerCrawl();
        } else {
            return 'Invalid slug';
        }

        return 'OK';
    }
}
