import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';

import { MailService } from '../mail';

export type MailJobName = 'sendEmailRegister' | 'sendEmailLogin';

@Processor('BULLMQ_MAIL_QUEUE')
@Injectable()
export class MailProcessor extends WorkerHost implements OnModuleInit {
    private mailService: MailService;

    constructor(private readonly logger: PinoLogger, private readonly moduleRef: ModuleRef) {
        super();
        this.logger.setContext(MailProcessor.name);
    }

    onModuleInit() {
        this.mailService = this.moduleRef.get<MailService>(MailService);
        this.logger.info(`${MailProcessor.name} for BULLMQ_MAIL_QUEUE is initialized and ready.`);
    }

    async process(job: Job<unknown, unknown, MailJobName>): Promise<unknown> {
        switch (job.name) {
            case 'sendEmailRegister':
                return this.sendEmailRegister(job);
            case 'sendEmailLogin':
                return this.sendEmailLogin(job);
            default:
                return;
        }
    }

    private async sendEmailRegister(job: Job<unknown, unknown, MailJobName>): Promise<unknown> {
        const { email, url } = job.data as { email: string; url: string };
        return this.mailService.sendConfirmMail({
            to: email,
            mailData: {
                url,
            },
        });
    }

    private async sendEmailLogin(job: Job<unknown, unknown, MailJobName>): Promise<unknown> {
        const { email, url, otp } = job.data as { email: string; url: string; otp: string };
        return this.mailService.sendLogin({
            to: email,
            mailData: {
                url,
                otp,
            },
        });
    }
}
