import { NextRequest, NextResponse } from 'next/server';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

export async function GET(request: NextRequest) {
    const searchParams = request?.nextUrl?.searchParams;
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('width');
    const height = searchParams.get('height');
    const quality = searchParams.get('quality') || '75';

    if (!imageUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
        return new NextResponse('Backend API URL is not configured', { status: 500 });
    }

    try {
        // Construct the backend API URL with the same parameters
        const backendUrl = getOptimizedImageUrl(imageUrl, {
            baseUrl: apiUrl,
            width: parseInt(width || '0', 10),
            height: parseInt(height || '0', 10),
            quality: parseInt(quality, 10),
        });

        // Fetch the optimized image from the backend
        const response = await fetch(backendUrl.toString());

        if (!response.ok) {
            throw new Error(`Backend API error! status: ${response.status}`);
        }

        // Create a ReadableStream from the response body
        const stream = response.body;

        // Get the Content-Type header from the backend response
        const contentType = response.headers.get('Content-Type') || 'image/webp';
        const cacheControl = `${
            response.headers.get('Cache-Control') || 'public, max-age=31536000, immutable'
        }, s-maxage=31536000`;

        // Return the streamed response
        return new NextResponse(stream, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': cacheControl,
                'CDN-Cache-Control': cacheControl,
                'Vercel-CDN-Cache-Control': cacheControl,
            },
        });
    } catch (error) {
        console.error('Image optimization error:', error);
        return new NextResponse('Error processing image', { status: 500 });
    }
}
