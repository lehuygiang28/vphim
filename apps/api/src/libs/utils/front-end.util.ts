import axios from 'axios';

export async function revalidateOnFrontEndSide(
    { webhookUrl, apiKey }: { webhookUrl: string; apiKey: string },
    {
        movieSlug = undefined,
        tags = undefined,
    }: {
        movieSlug?: string | string[];
        tags?: string[];
    },
) {
    if (!webhookUrl || !apiKey) {
        return;
    }

    if (!movieSlug || !tags) {
        return;
    }

    console.log({ webhookUrl, apiKey, movieSlug, tags });

    return axios.post(
        webhookUrl,
        { movieSlug, tags },
        {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        },
    );
}
