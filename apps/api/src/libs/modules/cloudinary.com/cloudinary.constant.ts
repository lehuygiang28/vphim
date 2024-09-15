export const CLOUDINARY_ROOT_FOLDER_NAME = 'TechCell' as const;
export const CLOUDINARY_ALLOW_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
export const CLOUDINARY_PROVIDER = 'CLOUDINARY_PROVIDER' as const;

export const MULTI_IMAGE_FILE_MAX_COUNT = 5;
export const IMAGE_FILE_MAX_SIZE_IN_MB = 10;
export const IMAGE_FILE_MAX_SIZE_IN_BYTES = 1024 * 1024 * IMAGE_FILE_MAX_SIZE_IN_MB;
export const IMAGE_FILE_ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'].join('|');
