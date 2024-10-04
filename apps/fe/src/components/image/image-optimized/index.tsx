'use client';

import React, { useState, useEffect, useRef, CSSProperties, forwardRef } from 'react';
import { Skeleton, Image as AntImage, ImageProps } from 'antd';

import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

export type ImageOptimizedProps = {
    url: string;
    url2?: string;
    alt: string;
    width: number | string;
    height: number | string;
    style?: CSSProperties;
    wrapperStyle?: CSSProperties;
    className?: string;
    shouldShowHorizontalImage?: boolean;
    quality?: number;
    disableSkeleton?: boolean;
};

const ForwardedImage = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
    return (
        <AntImage
            {...props}
            onLoad={(e) => {
                if (ref && 'current' in ref) {
                    ref.current = e.target as HTMLImageElement;
                }
                props.onLoad?.(e);
            }}
        />
    );
});

ForwardedImage.displayName = 'ForwardedImage';

const isBase64Image = (url: string) => {
    return url.includes('data:image/jpeg;base64,') || url.includes('data:image/png;base64,');
};

const extractBase64Data = (url: string) => {
    const base64Marker = 'base64,';
    const base64Index = url.indexOf(base64Marker);
    if (base64Index !== -1) {
        return url.substring(base64Index + base64Marker.length);
    }
    return url;
};

export function ImageOptimized({
    url,
    url2,
    alt,
    width,
    height,
    className,
    shouldShowHorizontalImage: reverse = false,
    style,
    wrapperStyle,
    quality = 60,
    disableSkeleton = false,
}: ImageOptimizedProps) {
    const [showImage1, setShowImage1] = useState(true);
    const [currentUrl1, setCurrentUrl1] = useState(
        getOptimizedImageUrl(url, { width, height, quality }),
    );
    const [currentUrl2, setCurrentUrl2] = useState(
        getOptimizedImageUrl(url2, { width, height, quality }),
    );
    const [isLoading, setIsLoading] = useState(true);
    const [image1Loaded, setImage1Loaded] = useState(false);
    const [image2Loaded, setImage2Loaded] = useState(false);
    const image1Ref = useRef<HTMLImageElement>(null);
    const image2Ref = useRef<HTMLImageElement>(null);

    const handleImageError = (imageNumber: 1 | 2) => {
        if (imageNumber === 1) {
            setCurrentUrl1(url);
        } else if (url2) {
            setCurrentUrl2(url2);
        }
    };

    useEffect(() => {
        setCurrentUrl1(getOptimizedImageUrl(url, { width, height, quality }));
        if (url2) {
            setCurrentUrl2(getOptimizedImageUrl(url2, { width, height, quality }));
        }
        setIsLoading(true);
        setImage1Loaded(false);
        setImage2Loaded(false);
    }, [url, url2, width, height, quality]);

    useEffect(() => {
        if (image1Loaded && (!url2 || image2Loaded)) {
            if (!url2) {
                setShowImage1(true);
                setIsLoading(false);
                return;
            }

            const img1 = image1Ref.current;
            const img2 = image2Ref.current;

            if (img1 && img2) {
                const isImage1Vertical = img1.naturalHeight > img1.naturalWidth;
                const isImage2Vertical = img2.naturalHeight > img2.naturalWidth;

                if (reverse) {
                    setShowImage1(
                        !isImage1Vertical && !isImage2Vertical ? true : !isImage1Vertical,
                    );
                } else {
                    setShowImage1(isImage1Vertical || isImage2Vertical ? isImage1Vertical : true);
                }
                setIsLoading(false);
            }
        }
    }, [image1Loaded, image2Loaded, reverse, url2]);

    const handleImageLoad = (imageNumber: 1 | 2) => {
        if (imageNumber === 1) {
            setImage1Loaded(true);
        } else {
            setImage2Loaded(true);
        }
    };

    const renderImage = (
        url: string,
        showImage: boolean,
        imageRef: React.RefObject<HTMLImageElement>,
        imageNumber: 1 | 2,
    ) => {
        if (!url) return null;

        if (isBase64Image(url)) {
            const base64Data = extractBase64Data(url);
            const imageType = url.includes('data:image/jpeg') ? 'jpeg' : 'png';
            const fullBase64Url = `data:image/${imageType};base64,${base64Data}`;

            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    ref={imageRef}
                    src={fullBase64Url}
                    alt={alt}
                    style={{
                        objectFit: 'cover',
                        ...style,
                        display: showImage && !isLoading ? style?.display ?? undefined : 'none',
                    }}
                    className={showImage ? className : ''}
                    onError={() => handleImageError(imageNumber)}
                    onLoad={() => handleImageLoad(imageNumber)}
                />
            );
        } else {
            return (
                <ForwardedImage
                    ref={imageRef}
                    src={url}
                    alt={alt}
                    preview={false}
                    style={{
                        objectFit: 'cover',
                        ...style,
                        display: showImage && !isLoading ? style?.display ?? undefined : 'none',
                    }}
                    className={showImage ? className : ''}
                    onError={() => handleImageError(imageNumber)}
                    onLoad={() => handleImageLoad(imageNumber)}
                    wrapperStyle={{ display: 'unset', ...wrapperStyle }}
                />
            );
        }
    };

    return (
        <>
            {isLoading && !disableSkeleton && (
                <Skeleton.Image
                    active={isLoading}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                    }}
                />
            )}
            {renderImage(currentUrl1, showImage1, image1Ref, 1)}
            {url2 && renderImage(currentUrl2, !showImage1, image2Ref, 2)}
        </>
    );
}
