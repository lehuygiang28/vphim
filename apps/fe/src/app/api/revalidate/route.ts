import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Check for API key in the request headers
        const apiKey = request.headers.get('x-api-key');
        if (apiKey !== process.env.REVALIDATE_API_KEY) {
            console.log('[Next.js] Invalid API key.');
            return NextResponse.json({ message: 'Invalid API key.' }, { status: 401 });
        }

        const payload = await request.json();

        // Check for required fields in the payload
        const { tags, movieSlug } = payload;

        // Validate movieSlug: must be a string or an array of strings
        if (!movieSlug && !tags) {
            return NextResponse.json(
                { message: 'movieSlug or tags is required.' },
                { status: 400 },
            );
        } else {
            // Revalidate the home page
            console.log('[Next.js] Revalidating /');
            revalidatePath('/');
        }

        if (movieSlug) {
            // Ensure movieSlug is an array if it's not already
            const movieSlugs = Array.isArray(movieSlug) ? movieSlug : [movieSlug];

            // Revalidate each movie page based on movieSlug
            for (const slug of movieSlugs) {
                console.log(`[Next.js] Revalidating /phim/${slug}`);
                revalidatePath(`/phim/${slug}`);
            }
        }

        // Revalidate tags
        if (tags && Array.isArray(tags)) {
            for (const tag of tags) {
                console.log(`[Next.js] Revalidating tag: ${tag}`);
                revalidateTag(tag); // Assuming you want to use revalidateTag for tags
            }
        }

        return NextResponse.json({ message: 'Revalidation successful' }, { status: 200 });
    } catch (error) {
        console.error('[Next.js] Revalidation error:', error.message);
        return NextResponse.json(
            { message: `Revalidation error: ${error.message}` },
            { status: 400 },
        );
    }
}
