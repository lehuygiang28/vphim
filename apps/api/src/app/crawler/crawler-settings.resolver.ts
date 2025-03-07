import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';

import { CrawlerSettingsType } from './dto/crawler-settings.type';
import { CrawlerSettingsService } from './dto/crawler-settings.service';
import {
    GetCrawlerSettingsInput,
    GetCrawlerSettingInput,
} from './dto/inputs/get-crawler-settings.input';
import { GetCrawlerSettingsOutput } from './dto/outputs/get-crawler-settings.output';
import { UpdateCrawlerSettingsInput } from './dto/inputs/update-crawler-settings.input';
import { RequiredRoles } from '../auth';
import { UserRoleEnum } from '../users';
import { TriggerCrawlerInput } from './dto/inputs/trigger-crawler.input';

@Resolver(() => CrawlerSettingsType)
export class CrawlerSettingsResolver {
    constructor(private readonly crawlerSettingsService: CrawlerSettingsService) {}

    @Query(() => GetCrawlerSettingsOutput, { name: 'crawlerSettings' })
    async getCrawlerSettings(@Args('input') input: GetCrawlerSettingsInput) {
        return this.crawlerSettingsService.getCrawlerSettings(input);
    }

    @Query(() => CrawlerSettingsType, { name: 'crawlerSetting' })
    async getCrawlerSetting(@Args('input') input: GetCrawlerSettingInput) {
        return this.crawlerSettingsService.getCrawlerSetting(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => CrawlerSettingsType, { name: 'updateCrawlerSettings' })
    async updateCrawlerSettings(@Args('input') input: UpdateCrawlerSettingsInput) {
        return this.crawlerSettingsService.updateCrawlerSettings(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Boolean, { name: 'triggerCrawler' })
    async triggerCrawler(@Args('input') input: TriggerCrawlerInput) {
        return this.crawlerSettingsService.triggerCrawler(input);
    }
}
