import { All, Controller, Logger, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    CopilotRuntime,
    copilotRuntimeNestEndpoint,
    GoogleGenerativeAIAdapter,
    OpenAIAdapter,
} from '@copilotkit/runtime';
import { Request, Response } from 'express';

import OpenAI from 'openai';
import type { RequestOptions, APIPromise } from 'openai/core';
import type { Stream } from 'openai/streaming';
import type {
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionCreateParamsStreaming,
    ChatCompletion,
    ChatCompletionChunk,
} from 'openai/resources/chat/completions';

function parseModelsCsv(value: string | undefined): string[] {
    if (!value) return [];
    return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

@Controller()
export class CopilotkitController {
    constructor(private readonly configService: ConfigService) {
        this.logger = new Logger(CopilotkitController.name);

        if (this.configService.get('GOOGLE_AI_USE_OPENAI_COMPATIBLE') === 'true') {
            this.USE_OPENAI_COMPATIBLE = true;
        }
    }

    protected readonly logger: Logger;
    private readonly USE_OPENAI_COMPATIBLE: boolean = false;
    private readonly DEFAULT_AI_MODELS: string[] = [
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash-preview-04-17',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
    ];
    private readonly copilotRuntime = new CopilotRuntime();

    @All('/copilotkit')
    async copilotkit(@Req() req: Request, @Res() res: Response) {
        let lastError: Error | null = null;

        const modelsFromEnv = parseModelsCsv(this.configService.get<string>('GOOGLE_AI_MODELS'));
        const modelsToTry = modelsFromEnv.length > 0 ? modelsFromEnv : this.DEFAULT_AI_MODELS;

        for (const model of modelsToTry) {
            try {
                this.logger.log(`Trying AI model: ${model}`);

                let adapter: GoogleGenerativeAIAdapter | OpenAIAdapter;

                if (this.USE_OPENAI_COMPATIBLE) {
                    const openAi = new OpenAI({
                        apiKey: this.configService.getOrThrow<string>('GOOGLE_AI_GPROXY_KEY'),
                        baseURL: this.configService.getOrThrow<string>('GOOGLE_AI_GPROXY_BASE_URL'),
                    });

                    // Force usage for streaming chat.completions
                    const originalCC = openAi.chat.completions.create.bind(openAi.chat.completions);
                    openAi.chat.completions.create = ((
                        body:
                            | ChatCompletionCreateParamsStreaming
                            | ChatCompletionCreateParamsNonStreaming,
                        options?: RequestOptions<unknown>,
                    ): APIPromise<ChatCompletion | Stream<ChatCompletionChunk>> =>
                        originalCC(
                            {
                                stream_options: { include_usage: true, ...body?.stream_options },
                                ...body,
                            },
                            options,
                        )) as typeof openAi.chat.completions.create;
                    adapter = new OpenAIAdapter({ openai: openAi, model });
                } else {
                    adapter = new GoogleGenerativeAIAdapter({ model });
                }

                const handler = copilotRuntimeNestEndpoint({
                    runtime: this.copilotRuntime,
                    serviceAdapter: adapter,
                    endpoint: '/copilotkit',
                    logLevel: 'info',
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
