import { revalidatePath } from 'next/cache';
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

        // Revalidate the home page
        console.log('[Next.js] Revalidating /');
        revalidatePath('/');

        // Revalidate specific movie pages
        if (payload.slugs && Array.isArray(payload.slugs)) {
            for (const slug of payload.slugs) {
                console.log(`[Next.js] Revalidating /phim/${slug}`);
                revalidatePath(`/phim/${slug}`);
            }
        }

        return NextResponse.json({ message: 'Revalidation successful' }, { status: 200 });
    } catch (error) {
        console.error('[Next.js] Revalidation error:', error);
        return NextResponse.json(
            { message: `Revalidation error: ${error.message}` },
            { status: 400 },
        );
    }
}
