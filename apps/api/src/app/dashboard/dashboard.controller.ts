import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardData } from './dashboard.type';
import { UserRoleEnum } from '../users/users.enum';
import { RequiredRoles } from '../auth';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
    private readonly logger = new Logger(DashboardController.name);

    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    @RequiredRoles(UserRoleEnum.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get dashboard data including statistics and analytics' })
    async getDashboard(): Promise<DashboardData> {
        try {
            this.logger.log('REST API: GET /dashboard');
            return await this.dashboardService.getDashboardData();
        } catch (error) {
            this.logger.error(`Error in GET /dashboard: ${error.message}`);
            throw error;
        }
    }
}
