'use client';

import React from 'react';
import { MoviePlay } from '@/components/pages/movie/play';

export type MovieEpisodePageProps = {
    params: { slug: string; episode: string };
};

export default function MovieEpisodePage({ params }: MovieEpisodePageProps) {
    return (
        <>
            <MoviePlay
                params={{ movieSlug: params?.slug || '', episodeSlug: params?.episode || '' }}
            />
        </>
    );
}
