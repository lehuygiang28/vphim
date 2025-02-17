'use client';

import React, { useState, useEffect, CSSProperties, useMemo } from 'react';
import { Image as AntImage } from 'antd';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

export type ImageOptimizedProps = {
    url: string;
    alt: string;
    width: number | string;
    height: number | string;
    style?: CSSProperties;
    wrapperStyle?: CSSProperties;
    className?: string;
    quality?: number;
    disableSkeleton?: boolean;
    loadType?: 'lazy' | 'eager';
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
};

const isBase64Image = (url: string) =>
    url.includes('data:image/jpeg;base64,') || url.includes('data:image/png;base64,');

const extractBase64Data = (url: string) => {
    const base64Marker = 'base64,';
    const base64Index = url.indexOf(base64Marker);
    return base64Index !== -1 ? url.substring(base64Index + base64Marker.length) : url;
};

const OptimizedImage = React.memo(
    ({
        url,
        alt,
        onError,
        onLoad,
        style,
        className,
        loadType,
        wrapperStyle,
    }: ImageOptimizedProps) => {
        const [currentUrl, setCurrentUrl] = useState(url);

        useEffect(() => {
            setCurrentUrl(url);
        }, [url]);

        const imageStyle: CSSProperties = useMemo(
            () => ({
                objectFit: 'cover',
                ...style,
            }),
            [style],
        );

        const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            onLoad?.(e);
        };

        if (isBase64Image(currentUrl)) {
            const base64Data = extractBase64Data(currentUrl);
            const imageType = currentUrl.includes('data:image/jpeg') ? 'jpeg' : 'png';
            const fullBase64Url = `data:image/${imageType};base64,${base64Data}`;

            return (
                <>
                    {/*eslint-disable-next-line @next/next/no-img-element*/}
                    <img
                        src={fullBase64Url}
                        alt={alt}
                        width={'100%'}
                        height={'100%'}
                        style={imageStyle}
                        className={className}
                        onError={onError}
                        onLoad={handleLoad}
                        loading={loadType}
                    />
                </>
            );
        }

        return (
            <AntImage
                src={currentUrl}
                alt={alt}
                width={'100%'}
                height={'100%'}
                preview={false}
                style={imageStyle}
                className={className}
                onError={onError}
                onLoad={handleLoad}
                wrapperStyle={{ display: 'unset', ...wrapperStyle }}
                loading={loadType}
                placeholder={true}
            />
        );
    },
);

OptimizedImage.displayName = 'OptimizedImage';

export function ImageOptimized({
    url,
    alt,
    width,
    height,
    className,
    style,
    wrapperStyle,
    quality = 60,
    loadType,
    ...props
}: ImageOptimizedProps) {
    const currentUrl = useMemo(
        () => getOptimizedImageUrl(url, { width, height, quality }),
        [url, width, height, quality],
    );

    // Use a unique key based on the URL to force re-mount of OptimizedImage
    return (
        <OptimizedImage
            key={currentUrl}
            url={currentUrl}
            alt={alt}
            style={style}
            className={className}
            loadType={loadType}
            wrapperStyle={wrapperStyle}
            width={width}
            height={height}
            {...props}
        />
    );
}
