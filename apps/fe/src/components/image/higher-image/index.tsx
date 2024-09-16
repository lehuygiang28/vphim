'use client';

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import Image from 'next/image';
import { Skeleton } from 'antd';

export type HigherHeightImageProps = {
    url1: string;
    url2: string;
    alt: string;
    width: number | string;
    height: number | string;
    style?: CSSProperties;
    className?: string;
    reverse?: boolean;
    quality?: number;
    environmentNames?: string[];
    disableSkeleton?: boolean;
};

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

export function HigherHeightImage({
    url1,
    url2,
    alt,
    width,
    height,
    className,
    reverse = false,
    style,
    quality = 75,
    environmentNames = ['giang04', 'techcell', 'gcp-1408'],
    disableSkeleton = false, // Default to false to maintain current behavior
}: HigherHeightImageProps) {
    const [showImage1, setShowImage1] = useState(true);
    const [currentUrl1, setCurrentUrl1] = useState(url1);
    const [currentUrl2, setCurrentUrl2] = useState(url2);
    const [isLoading, setIsLoading] = useState(true);
    const image1Ref = useRef<HTMLImageElement>(null);
    const image2Ref = useRef<HTMLImageElement>(null);

    const getCloudinaryUrl = (url: string, envName: string) =>
        `https://res.cloudinary.com/${envName}/image/fetch/${url}`;

    const handleImageError = (imageNumber: 1 | 2) => {
        const updateUrl = (
            originalUrl: string,
            currentUrl: string,
            setUrl: React.Dispatch<React.SetStateAction<string>>,
        ) => {
            if (isBase64Image(originalUrl)) {
                console.error(`Failed to load base64 image`);
                return;
            }

            if (currentUrl === originalUrl) {
                if (environmentNames.length > 0) {
                    setUrl(getCloudinaryUrl(originalUrl, environmentNames[0]));
                }
            } else {
                const currentEnvIndex = environmentNames.findIndex((env) =>
                    currentUrl.includes(`res.cloudinary.com/${env}`),
                );
                if (currentEnvIndex < environmentNames.length - 1) {
                    setUrl(getCloudinaryUrl(originalUrl, environmentNames[currentEnvIndex + 1]));
                } else {
                    console.error(`Failed to load image after trying all environment names`);
                }
            }
        };

        if (imageNumber === 1) {
            updateUrl(url1, currentUrl1, setCurrentUrl1);
        } else {
            updateUrl(url2, currentUrl2, setCurrentUrl2);
        }
    };

    useEffect(() => {
        setCurrentUrl1(url1);
        setCurrentUrl2(url2);
        setIsLoading(true);
    }, [url1, url2]);

    useEffect(() => {
        const checkAndSetImage = () => {
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
        };

        const image1 = image1Ref.current;
        const image2 = image2Ref.current;

        if (image1 && image2) {
            if (image1.complete && image2.complete) {
                checkAndSetImage();
            } else {
                const handleLoad = () => {
                    if (image1.complete && image2.complete) {
                        checkAndSetImage();
                    }
                };

                image1.addEventListener('load', handleLoad);
                image2.addEventListener('load', handleLoad);

                return () => {
                    image1.removeEventListener('load', handleLoad);
                    image2.removeEventListener('load', handleLoad);
                };
            }
        }
    }, [reverse, currentUrl1, currentUrl2]);

    const renderImage = (
        url: string,
        showImage: boolean,
        imageRef: React.RefObject<HTMLImageElement>,
        imageNumber: 1 | 2,
    ) => {
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
                        opacity: showImage && !isLoading ? 1 : 0,
                        objectFit: 'cover',
                        ...style,
                    }}
                    className={showImage ? className : ''}
                    onError={() => handleImageError(imageNumber)}
                    onLoad={() => setIsLoading(false)}
                />
            );
        } else {
            return (
                <Image
                    ref={imageRef}
                    src={url}
                    alt={alt}
                    fill
                    sizes={`(max-width: ${width}px) 100vw, ${width}px`}
                    style={{
                        opacity: showImage && !isLoading ? 1 : 0,
                        objectFit: 'cover',
                        ...style,
                    }}
                    className={showImage ? className : ''}
                    quality={quality}
                    onError={() => handleImageError(imageNumber)}
                    onLoad={() => setIsLoading(false)}
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
            {renderImage(currentUrl2, !showImage1, image2Ref, 2)}
        </>
    );
}
