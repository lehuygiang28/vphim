import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { Ophim, Category as OPhimCategory } from 'ophim-js';

import { CategoryRepository } from './category.repository';
import { isNullOrUndefined } from '../../libs/utils/common';
import { Category } from './category.schema';

@Injectable()
export class CategoryCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly CATEGORY_CRON: string = '0 2 * * *';
    private readonly logger = new Logger(CategoryCrawler.name);
    private readonly ophim: Ophim;

    constructor(
        private readonly categoryRepo: CategoryRepository,
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {
        if (!isNullOrUndefined(this.configService.get('CATEGORY_CRON'))) {
            this.CATEGORY_CRON = this.configService.getOrThrow<string>('CATEGORY_CRON');
        }

        this.ophim = new Ophim({
            host: configService.get('OPHIM_HOST'),
        });
    }

    onModuleInit() {
        const crawCategoryJob = new CronJob(this.CATEGORY_CRON, this.crawCategory.bind(this));
        this.schedulerRegistry.addCronJob(this.crawCategory.name, crawCategoryJob);
        crawCategoryJob.start();
    }

    onModuleDestroy() {
        this.schedulerRegistry.deleteCronJob(this.crawCategory.name);
    }

    async crawCategory() {
        this.logger.log('Crawling category ...');
        return this.crawl();
    }

    async crawl() {
        const category = await this.ophim.getCategories();
        const fetchedCategories = category?.data.items ?? [];

        if (fetchedCategories?.length === 0) {
            this.logger.error('Get category failed');
            return;
        }

        // Fetch existing slugs from the database
        const existingSlugs = (
            (await this.categoryRepo.find({
                filterQuery: {},
                projectionType: { slug: 1 },
            })) || []
        )?.map((category) => category.slug);

        // Filter new category based on slug
        // Then map them to the format required by the database
        const newCategories: Category[] = fetchedCategories
            .filter((category: OPhimCategory) => !existingSlugs.includes(category.slug))
            .map((category: OPhimCategory) => ({
                _id: category?._id ? new Types.ObjectId(category._id) : null,
                name: category.name,
                slug: category.slug,
            }));

        if (newCategories?.length === 0) {
            this.logger.log('No new category found');
            return;
        }

        const res = await this.categoryRepo.insertMany(newCategories);
        this.logger.log(`Inserted ${res.length} new category`);
    }
}
