import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CopilotkitController } from './copilotkit.controller';

@Module({
    imports: [ConfigModule],
    controllers: [CopilotkitController],
})
export class CopilotkitModule {}
