import { All, Controller, Req, Res } from '@nestjs/common';
import {
    CopilotRuntime,
    copilotRuntimeNestEndpoint,
    GoogleGenerativeAIAdapter,
} from '@copilotkit/runtime';
import { Request, Response } from 'express';

@Controller()
export class CopilotkitController {
    private readonly AI_MODELS: string[] = ['gemini-1.5-flash-8b', 'gemini-1.5-flash'];

    @All('/copilotkit')
    copilotkit(@Req() req: Request, @Res() res: Response) {
        try {
            const serviceAdapter = new GoogleGenerativeAIAdapter({ model: this.AI_MODELS[0] });
            const runtime = new CopilotRuntime();

            const handler = copilotRuntimeNestEndpoint({
                runtime,
                serviceAdapter,
                endpoint: '/copilotkit',
            });
            return handler(req, res);
        } catch (error) {
            const serviceAdapter = new GoogleGenerativeAIAdapter({ model: this.AI_MODELS[1] });
            const runtime = new CopilotRuntime();

            const handler = copilotRuntimeNestEndpoint({
                runtime,
                serviceAdapter,
                endpoint: '/copilotkit',
            });
            return handler(req, res);
        }
    }
}
