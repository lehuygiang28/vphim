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
    private readonly AI_MODELS: string[] = ['gemini-2.0-flash-lite-preview-02-05', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

    @All('/copilotkit')
    async copilotkit(@Req() req: Request, @Res() res: Response) {
        let lastError: Error | null = null;

        for (const model of this.AI_MODELS) {
            try {
                const serviceAdapter = new GoogleGenerativeAIAdapter({ model });
                const runtime = new CopilotRuntime();

                const handler = copilotRuntimeNestEndpoint({
                    runtime,
                    serviceAdapter,
                    endpoint: '/copilotkit',
                });

                return handler(req, res);
            } catch (error) {
                lastError = error as Error;
				this.logger.error(`Error with model ${model}:`, error);
                continue; // Try next model
            }
        }

        // If we get here, all models failed
        res.status(500).json({
            error: 'All AI models failed',
            lastError: lastError?.message
        });
    }
}
