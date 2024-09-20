import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiParam } from '@nestjs/swagger';

import { KKPhimCrawler } from './kkphim.crawler';
import { OphimCrawler } from './ophim.crawler';
import { NguoncCrawler } from './nguonc.crawler';

@Controller({ path: 'trigger-crawl' })
export class CrawlController {
    constructor(
        private readonly kkphim: KKPhimCrawler,
        private readonly ophim: OphimCrawler,
        private readonly nguonc: NguoncCrawler,
    ) {}

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
        if (pw !== process.env.CRAWLER_PW) {
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
