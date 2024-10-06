import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const CLOUDINARY_ENV_NAMES = ['giang04', 'techcell', 'gcp-1408'];

async function fetchImageWithFallback(url: string): Promise<Buffer | null> {
    try {
        return await fetchImage(url);
    } catch (fetchError) {
        console.warn(`Failed to fetch image from original URL: ${url}`);
        return await fetchThroughCloudinary(url);
    }
}

async function fetchImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

async function optimizeImageBuffer(
    buffer: Buffer,
    width: number,
    height: number,
    quality: number,
): Promise<Buffer> {
    return sharp(buffer)
        .resize({
            width: width || undefined,
            height: height || undefined,
            fit: 'inside',
            withoutEnlargement: true,
            fastShrinkOnLoad: true,
        })
        .webp({ quality })
        .toBuffer();
}

async function fetchThroughCloudinary(url: string): Promise<Buffer | null> {
    for (const envName of CLOUDINARY_ENV_NAMES) {
        try {
            const cloudinaryUrl = `https://res.cloudinary.com/${envName}/image/fetch/${url}`;
            return await fetchImage(cloudinaryUrl);
        } catch (error) {
            console.warn(`Failed to fetch image from Cloudinary (${envName}): ${error.message}`);
        }
    }
    return null;
}

function getResponseHeaders() {
    return {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const width = parseInt(searchParams.get('width') || '0', 10);
    const height = parseInt(searchParams.get('height') || '0', 10);
    const quality = parseInt(searchParams.get('quality') || '75', 10);

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        // Fetch and optimize image
        const imageBuffer = await fetchImageWithFallback(url);
        if (!imageBuffer) {
            return new NextResponse('Cannot fetch image buffer', { status: 422 });
        }

        const optimizedImage = await optimizeImageBuffer(imageBuffer, width, height, quality);
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(optimizedImage);
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: getResponseHeaders(),
        });
    } catch (error) {
        console.error('Image optimization error:', error);
        return new NextResponse('Error processing image', { status: 500 });
    }
}
