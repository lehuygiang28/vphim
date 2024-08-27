import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { Ophim, Region as OPhimRegion } from 'ophim-js';

import { RegionsRepository } from './region.repository';
import { isNullOrUndefined } from '../../libs/utils/common';
import { Region } from './region.schema';

@Injectable()
export class RegionCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly REGIONS_CRON: string = '0 2 * * *';
    private readonly logger = new Logger(RegionCrawler.name);
    private readonly ophim: Ophim;

    constructor(
        private readonly regionsRepo: RegionsRepository,
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {
        if (!isNullOrUndefined(configService.get('REGIONS_CRON'))) {
            this.REGIONS_CRON = configService.getOrThrow<string>('REGIONS_CRON');
        }

        this.ophim = new Ophim({
            host: configService.get('OPHIM_HOST'),
        });
    }

    onModuleInit() {
        const crawRegionJob = new CronJob(this.REGIONS_CRON, this.crawRegion.bind(this));
        this.schedulerRegistry.addCronJob(this.crawRegion.name, crawRegionJob);
        crawRegionJob.start();
    }

    onModuleDestroy() {
        this.schedulerRegistry.deleteCronJob(this.crawRegion.name);
    }

    async crawRegion() {
        this.logger.log('crawling regions ...');
        return this.crawl();
    }

    async crawl() {
        const regions = await this.ophim.getRegions();
        const fetchedRegions = regions?.data.items ?? [];

        // Fetch existing slugs from the database
        const existingSlugs = (
            await this.regionsRepo.find({
                filterQuery: {},
                projectionType: { slug: 1 },
            })
        ).map((region) => region.slug);

        // Filter new regions based on slug
        const newRegions = fetchedRegions.filter(
            (region: OPhimRegion) => !existingSlugs.includes(region.slug),
        );

        // Map and insert new regions only
        const mappedRegions: Region[] = newRegions.map((region: OPhimRegion) => ({
            _id: region?._id ? new Types.ObjectId(region._id) : null,
            name: region.name,
            slug: region.slug,
        }));

        const res = await this.regionsRepo.insertMany(mappedRegions);
        this.logger.log(`Inserted ${res.length} new regions`);
    }
}
