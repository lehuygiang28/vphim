import { All, Controller, Logger, Req, Res } from '@nestjs/common';
import {
    CopilotRuntime,
    copilotRuntimeNestEndpoint,
    GoogleGenerativeAIAdapter,
} from '@copilotkit/runtime';
import { Request, Response } from 'express';

@Controller()
export class CopilotkitController {
    private readonly logger: Logger = new Logger(CopilotkitController.name);
    private readonly AI_MODELS: string[] = [
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-2.5-flash-preview-04-17',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
    ];
    private readonly copilotRuntime = new CopilotRuntime();

    @All('/copilotkit')
    async copilotkit(@Req() req: Request, @Res() res: Response) {
        let lastError: Error | null = null;

        for (const model of this.AI_MODELS) {
            try {
                this.logger.log(`Trying AI model: ${model}`);
                const serviceAdapter = new GoogleGenerativeAIAdapter({ model });

                const handler = copilotRuntimeNestEndpoint({
                    runtime: this.copilotRuntime,
                    serviceAdapter,
                    endpoint: '/copilotkit',
                    logLevel: 'debug',
                });

                return handler(req, res);
            } catch (error) {
                lastError = error as Error;
                this.logger.error(`Error with model ${model}:`, error);
                // Continue to next model
            }
        }

        // If we get here, all models failed
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'All AI models failed',
                lastError: lastError?.message,
            });
        }
    }
}
