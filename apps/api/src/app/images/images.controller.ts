import {
    BadRequestException,
    Controller,
    FileTypeValidator,
    Get,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    PayloadTooLargeException,
    Post,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConsumes,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiPayloadTooLargeResponse,
    ApiTags,
    ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ImageUploadedResponseDTO, PublicIdDTO } from './dtos';
import { ImagesService } from './images.service';
import {
    MULTI_IMAGE_FILE_MAX_COUNT,
    IMAGE_FILE_ACCEPTED_EXTENSIONS,
    IMAGE_FILE_MAX_SIZE_IN_BYTES,
    IMAGE_FILE_MAX_SIZE_IN_MB,
} from 'apps/api/src/libs/modules/cloudinary.com';
import { RequiredRoles } from 'apps/api/src/app/auth/guards';
import { MulterFile } from './multer.type';

@ApiBadRequestResponse({
    description: 'Invalid request, please check your request data!',
})
@ApiNotFoundResponse({
    description: 'Not found data, please try again!',
})
@ApiTooManyRequestsResponse({
    description: 'Too many requests, please try again later!',
})
@ApiInternalServerErrorResponse({
    description: 'Internal server error, please try again later!',
})
@ApiTags('images')
@Controller({
    path: 'images',
})
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @ApiOperation({
        summary: 'Get image by public id',
    })
    @ApiOkResponse({
        description: 'Image found',
        type: ImageUploadedResponseDTO,
    })
    @ApiNotFoundResponse({
        description: 'Image not found',
    })
    @Get('/:publicId')
    async getImageByPublicId(@Param() { publicId }: PublicIdDTO) {
        return this.imagesService.getImageByPublicId(publicId);
    }

    @ApiOperation({
        summary: 'Upload multiple image',
    })
    @ApiConsumes('multipart/form-data')
    @ApiCreatedResponse({
        description: 'Images uploaded',
        type: ImageUploadedResponseDTO,
        isArray: true,
    })
    @ApiPayloadTooLargeResponse({
        description: `Image size too large, maximum ${IMAGE_FILE_MAX_SIZE_IN_MB} MB, and maximum ${MULTI_IMAGE_FILE_MAX_COUNT} images`,
    })
    @ApiBody({
        description: 'Image files to upload as multipart/form-data',
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                        description: `Maximum image size is ${IMAGE_FILE_MAX_SIZE_IN_MB} MB (${IMAGE_FILE_MAX_SIZE_IN_BYTES} bytes)`,
                    },
                },
            },
        },
    })
    @UseInterceptors(
        FilesInterceptor('images', MULTI_IMAGE_FILE_MAX_COUNT, {
            limits: {
                files: MULTI_IMAGE_FILE_MAX_COUNT,
                fileSize: IMAGE_FILE_MAX_SIZE_IN_BYTES,
            },
            fileFilter: (req, file, cb) => {
                if (
                    !RegExp(`\\.(${IMAGE_FILE_ACCEPTED_EXTENSIONS})$`).exec(
                        file.originalname?.toLowerCase(),
                    )
                ) {
                    return cb(
                        new BadRequestException(
                            `Only ${IMAGE_FILE_ACCEPTED_EXTENSIONS} are allowed!`,
                        ),
                        false,
                    );
                }
                if (file.size > IMAGE_FILE_MAX_SIZE_IN_BYTES) {
                    return cb(
                        new PayloadTooLargeException(
                            `Maximum image size is ${IMAGE_FILE_MAX_SIZE_IN_MB} MB (${IMAGE_FILE_MAX_SIZE_IN_BYTES} bytes)`,
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    @RequiredRoles([])
    @Post('/')
    async uploadArrayImages(
        @UploadedFiles(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: IMAGE_FILE_MAX_SIZE_IN_BYTES }),
                    new FileTypeValidator({
                        fileType: 'image',
                    }),
                ],
                fileIsRequired: true,
            }),
        )
        images: MulterFile[],
    ): Promise<(ImageUploadedResponseDTO | undefined)[]> {
        return this.imagesService.uploadArrayImage({
            images,
        });
    }
}
