import { Injectable } from '@nestjs/common';
import {
    AdminAndResourceOptions,
    v2 as cloudinary,
    ResourceApiResponse,
    UploadApiOptions,
} from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';
import { CLOUDINARY_ALLOW_IMAGE_FORMATS, CLOUDINARY_ROOT_FOLDER_NAME } from './cloudinary.constant';
import { buildPublicId } from './cloudinary.util';
import { MulterFile } from 'apps/api/src/app/images/multer.type';

@Injectable()
export class CloudinaryService {
    async uploadImage(file: MulterFile): Promise<CloudinaryResponse> {
        const options: UploadApiOptions = {
            folder: CLOUDINARY_ROOT_FOLDER_NAME,
            allowedFormats: CLOUDINARY_ALLOW_IMAGE_FORMATS,
            public_id: buildPublicId(file),
            transformation: {
                format: 'auto',
                quality: 'auto',
                fetch_format: 'auto',
                dpr: 'auto',
            },
        };

        const uploadPromise = (file: MulterFile) =>
            new Promise<CloudinaryResponse>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result as unknown as CloudinaryResponse);
                });

                const fileBuffer = Buffer.isBuffer(file.buffer)
                    ? file.buffer
                    : Buffer.from(file.buffer);
                streamifier.createReadStream(fileBuffer).pipe(uploadStream);
            });

        const response = await uploadPromise(file);
        return {
            ...response,
            url: response.url,
            secure_url: response.secure_url,
        };
    }

    deleteFile(publicId: string): Promise<CloudinaryResponse> {
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async getImageByPublicId(publicId: string): Promise<CloudinaryResponse> {
        const getImageById = (publicId: string) =>
            new Promise<CloudinaryResponse>((resolve, reject) => {
                cloudinary.api.resource(publicId, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

        const response = await getImageById(publicId);
        return {
            ...response,
            url: response.url,
            secure_url: response.secure_url,
        };
    }

    public async getImagesInFolder({
        maxResults = 10,
        folderName = CLOUDINARY_ROOT_FOLDER_NAME,
        next_cursor = undefined,
    }: {
        maxResults?: number;
        folderName?: string;
        next_cursor?: string;
    }): Promise<ResourceApiResponse> {
        const options: AdminAndResourceOptions = {
            resource_type: 'image',
            type: 'upload',
            prefix: folderName,
            max_results: maxResults,
            next_cursor: next_cursor,
            transformation: {
                format: 'auto',
                quality: 'auto',
                fetch_format: 'auto',
                dpr: 'auto',
            },
        };

        const getImagesInFolder = (options: AdminAndResourceOptions) =>
            new Promise<ResourceApiResponse>((resolve, reject) => {
                cloudinary.api.resources(options, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

        const images = await getImagesInFolder(options);
        images?.resources?.forEach((image) => {
            return {
                ...image,
                url: image.url,
                secure_url: image.secure_url,
            };
        });

        return images;
    }
}
