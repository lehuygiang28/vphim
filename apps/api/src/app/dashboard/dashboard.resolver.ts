import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardData } from './dashboard.type';
import { RequiredRoles } from '../auth';
import { UserRoleEnum } from '../users/users.enum';

@Resolver()
export class DashboardResolver {
    private readonly logger = new Logger(DashboardResolver.name);

    constructor(private readonly dashboardService: DashboardService) {}

    @Query(() => DashboardData)
    @RequiredRoles(UserRoleEnum.Admin)
    async getDashboard(): Promise<DashboardData> {
        try {
            this.logger.log('GraphQL Query: getDashboard');
            return await this.dashboardService.getDashboardData();
        } catch (error) {
            this.logger.error(`Error in getDashboard query: ${error.message}`);
            throw error;
        }
    }
}
