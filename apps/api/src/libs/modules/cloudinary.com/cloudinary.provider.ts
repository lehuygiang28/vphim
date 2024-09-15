import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_PROVIDER } from './cloudinary.constant';

export const CloudinaryProvider = {
    provide: CLOUDINARY_PROVIDER,
    useFactory: () => {
        return cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    },
};
