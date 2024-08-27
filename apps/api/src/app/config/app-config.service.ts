import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from './all-config.type';

@Injectable()
export class AppConfigService {
    constructor(private configService: ConfigService<AllConfig>) {}
}
