import {
    Controller,
    Get,
    Query,
    Res,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller({ path: '/' })
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/ping')
    async getPing() {
        return 'pong';
    }

    /**
     * GET endpoint to process an m3u8 file.
     * Query Parameters:
     *  - provider: 'o' or 'k'
     *  - m3u8Url: URL of the m3u8 playlist
     *  - removalIndex: (Optional) nth discontinuity marker to remove
     */
    @Get('p3')
    async processM3u8(
        @Query('p') provider: string,
        @Query('u') m3u8Url: string,
        @Query('i') removalIndex: string, // provided as string, convert to number
        @Res() res: Response,
    ) {
        // Validate provider input
        if (provider !== 'o' && provider !== 'k') {
            throw new BadRequestException();
        }

        // Convert removalIndex to number if provided
        let index: number | undefined = removalIndex ? parseInt(removalIndex, 10) : undefined;
        if (removalIndex && isNaN(index)) {
            index = undefined;
        }

        try {
            // Process the m3u8 file via AppService
            const processedContent = await this.appService.processM3U8(
                provider === 'o' ? 'o' : 'k',
                m3u8Url,
                index,
            );

            // Set the MIME type to HLS playlist type
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            // Cache for 30 days (2592000 seconds)
            res.setHeader('Cache-Control', 'public, max-age=2592000');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(processedContent);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }
}
