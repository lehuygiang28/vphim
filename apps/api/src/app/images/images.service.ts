import {
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import sharp from 'sharp';
import { Response } from 'express';

import { RedisService } from '../../libs/modules/redis';
import { OptimizeImageDTO } from './dtos/optimize-image.dto';
import { ImageUploadedResponseDTO } from './dtos';
import { MulterFile } from './multer.type';
import { CloudinaryService } from '../../libs/modules/cloudinary.com';
import { ConfigService } from '@nestjs/config';
import { isNullOrUndefined } from '../../libs/utils/common';

@Injectable()
export class ImagesService {
    private readonly CLOUDINARY_ENV_NAMES = ['giang04', 'techcell', 'gcp-1408'];
    private readonly IMAGE_HASH_KEY = 'optimized_images';
    private readonly IMAGE_EXPIRATION_KEY = 'optimized_images_expiration';
    private readonly CACHE_DURATION = 3600 * 4; // 4 hour in seconds
    private readonly logger = new Logger(ImagesService.name);

    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {
        if (
            !isNullOrUndefined(this.configService.get('IMAGE_OPTIMIZATION_CACHE_DURATION')) &&
            !isNaN(Number(this.configService.get('IMAGE_OPTIMIZATION_CACHE_DURATION')))
        ) {
            this.CACHE_DURATION = parseInt(
                this.configService.get('IMAGE_OPTIMIZATION_CACHE_DURATION'),
            );
        }
    }

    async optimizeImage(data: OptimizeImageDTO, res: Response) {
        const { url, width, height, quality = 75 } = data;
        const cacheKey = `${url}:${width}:${height}:${quality}`;

        try {
            this.setCorsHeaders(res);
            const cachedImage = await this.getCachedImage(cacheKey);

            if (cachedImage) {
                return res.send(cachedImage);
            }

            let imageBuffer: Buffer;
            try {
                imageBuffer = await this.fetchImage(url);
            } catch (fetchError) {
                this.logger.warn(`Failed to fetch image from original URL: ${url}`);
                imageBuffer = await this.fetchThroughCloudinary(url);
            }

            if (!imageBuffer) {
                throw new HttpException('cannotFetchImageBuffer', HttpStatus.UNPROCESSABLE_ENTITY);
            }

            const optimizedImage = await this.optimizeImageBuffer(
                imageBuffer,
                width,
                height,
                quality,
            );

            await this.cacheOptimizedImage(cacheKey, optimizedImage);

            return res.send(optimizedImage);
        } catch (error) {
            this.logger.error(error);
            this.setCorsHeaders(res, true);
            return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                errors: {
                    image: 'imageNotOptimized',
                },
            });
        }
    }

    private setCorsHeaders(res: Response, isError = false) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        if (isError) {
            res.setHeader('Content-Type', 'application/json');
        } else {
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }

    private async getCachedImage(cacheKey: string): Promise<Buffer | null> {
        const client = this.redisService.getClient;
        const cachedImage = await client.hget(this.IMAGE_HASH_KEY, cacheKey);
        if (cachedImage) {
            const ttl = await client.zscore(this.IMAGE_EXPIRATION_KEY, cacheKey);
            if (ttl && Number(ttl) > Date.now()) {
                return Buffer.from(cachedImage, 'base64');
            } else {
                await this.removeCachedImage(cacheKey);
            }
        }
        return null;
    }

    private async cacheOptimizedImage(cacheKey: string, imageBuffer: Buffer): Promise<void> {
        const client = this.redisService.getClient;
        const base64Image = imageBuffer.toString('base64');
        await client.hset(this.IMAGE_HASH_KEY, cacheKey, base64Image);
        await client.zadd(
            this.IMAGE_EXPIRATION_KEY,
            Date.now() + this.CACHE_DURATION * 1000,
            cacheKey,
        );
    }

    private async removeCachedImage(cacheKey: string): Promise<void> {
        const client = this.redisService.getClient;
        await client.hdel(this.IMAGE_HASH_KEY, cacheKey);
        await client.zrem(this.IMAGE_EXPIRATION_KEY, cacheKey);
    }

    private async fetchImage(url: string): Promise<Buffer> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    private async optimizeImageBuffer(
        buffer: Buffer,
        width: number,
        height: number,
        quality: number,
    ): Promise<Buffer> {
        return sharp(buffer)
            .resize(Number(width), Number(height), { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: Number(quality) })
            .toBuffer();
    }

    private async fetchThroughCloudinary(url: string): Promise<Buffer> {
        for (const envName of this.CLOUDINARY_ENV_NAMES) {
            try {
                const cloudinaryUrl = `https://res.cloudinary.com/${envName}/image/fetch/${url}`;
                const imageBuffer = await this.fetchImage(cloudinaryUrl);
                return imageBuffer;
            } catch (error) {
                this.logger.warn(
                    `Failed to fetch image from Cloudinary (${envName}): ${error.message}`,
                );
            }
        }
        throw new Error('Failed to fetch image from all Cloudinary environments');
    }

    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredImages() {
        const client = this.redisService.getClient;
        const now = Date.now();

        try {
            // Get expired keys
            const expiredKeys = await client.zrangebyscore(this.IMAGE_EXPIRATION_KEY, 0, now);

            if (expiredKeys.length > 0) {
                // Remove from hash
                await client.hdel(this.IMAGE_HASH_KEY, ...expiredKeys);
                // Remove from sorted set
                await client.zremrangebyscore(this.IMAGE_EXPIRATION_KEY, 0, now);

                this.logger.log(`Removed ${expiredKeys.length} expired images from cache`);
            }
        } catch (error) {
            this.logger.error('Error during cache cleanup', error);
        }
    }

    async getImages() {
        try {
            const images = await this.cloudinaryService.getImagesInFolder({
                next_cursor: undefined,
            });
            return {
                images,
            };
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('Get images failed, please try again later');
        }
    }

    /**
     *
     * @param publicId Public id of image
     * @returns Image uploaded, otherwise throw http error
     */
    async getImageByPublicId(publicId: string) {
        try {
            const image = await this.cloudinaryService.getImageByPublicId(publicId);
            return new ImageUploadedResponseDTO(image);
        } catch (error) {
            if (error.http_code === 404) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            image: 'imageNotFound',
                            publicId,
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
            this.logger.error(error);
            throw new InternalServerErrorException('Get images failed, please try again later');
        }
    }

    private async uploadSingleImage(image: MulterFile) {
        try {
            const uploadedImage = await this.cloudinaryService.uploadImage(image);
            return new ImageUploadedResponseDTO(uploadedImage);
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(`Upload images failed, please try again later`);
        }
    }

    async uploadArrayImage({ images }: { images: MulterFile[] }) {
        const uploadedFilenames = new Set();

        const uploadedImages = await Promise.all(
            images.map(async (image) => {
                if (!uploadedFilenames.has(image.filename)) {
                    const uploadedImage = await this.uploadSingleImage(image);
                    uploadedFilenames.add(image.filename);
                    return uploadedImage;
                }
            }),
        );

        return uploadedImages;
    }
}
