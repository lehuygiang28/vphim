import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { DashboardController } from './dashboard.controller';
import { MovieModule } from '../movies/movie.module';
import { UsersModule } from '../users';
import { CommentsModule } from '../comments/comments.module';

@Module({
    imports: [MovieModule, UsersModule, CommentsModule],
    providers: [DashboardService, DashboardResolver],
    controllers: [DashboardController],
    exports: [DashboardService],
})
export class DashboardModule {}
