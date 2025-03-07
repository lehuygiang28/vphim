import { Resolver, Query, Args, Mutation, Int, ResolveField, Parent } from '@nestjs/graphql';

import { CrawlerSettingsType } from './crawler-settings.type';
import { CrawlerSettingsService } from './crawler-settings.service';
import {
    GetCrawlerSettingsInput,
    GetCrawlerSettingInput,
} from './inputs/get-crawler-settings.input';
import { GetCrawlerSettingsOutput } from './outputs/get-crawler-settings.output';
import { UpdateCrawlerSettingsInput } from './inputs/update-crawler-settings.input';
import { RequiredRoles } from '../../auth';
import { UserRoleEnum } from '../../users';
import { CreateCrawlerSettingsInput } from './inputs/create-crawler-settings.input';
import { DeleteCrawlerSettingsInput } from './inputs/delete-crawler-settings.input';
import { TriggerCrawlerInput } from './inputs/trigger-crawler.input';

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
    @Mutation(() => CrawlerSettingsType, { name: 'createCrawlerSettings' })
    async createCrawlerSettings(@Args('input') input: CreateCrawlerSettingsInput) {
        return this.crawlerSettingsService.createCrawlerSettings(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Int, { name: 'deleteCrawlerSettings' })
    async deleteCrawlerSettings(@Args('input') input: DeleteCrawlerSettingsInput) {
        return this.crawlerSettingsService.deleteCrawlerSettings(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Boolean, { name: 'triggerCrawler' })
    async triggerCrawler(@Args('input') input: TriggerCrawlerInput) {
        return this.crawlerSettingsService.triggerCrawler(input);
    }
}
