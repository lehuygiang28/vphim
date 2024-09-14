import React from 'react';
import { Movie } from '@/components/pages/movie';

export type MoviePageProps = {
    params: { slug: string };
};

export default function MoviePage({ params }: MoviePageProps) {
    return <Movie slug={params?.slug ?? ''} />;
}
