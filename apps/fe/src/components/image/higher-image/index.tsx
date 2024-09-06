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
}: HigherHeightImageProps) {
    const [showImage1, setShowImage1] = useState(true);
    const [loading, setLoading] = useState(true);
    const image1Ref = useRef<HTMLImageElement>(null);
    const image2Ref = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const checkAndSetImage = () => {
            const img1 = image1Ref.current;
            const img2 = image2Ref.current;

            if (img1 && img2) {
                const isImage1Vertical = img1.naturalHeight > img1.naturalWidth;
                const isImage2Vertical = img2.naturalHeight > img2.naturalWidth;

                if (reverse) {
                    // If reverse is true, choose the horizontal image
                    if (!isImage1Vertical && !isImage2Vertical) {
                        setShowImage1(true);
                    } else {
                        setShowImage1(!isImage1Vertical);
                    }
                } else {
                    // If reverse is false (default), choose the vertical image
                    if (isImage1Vertical || isImage2Vertical) {
                        setShowImage1(isImage1Vertical);
                    } else {
                        setShowImage1(true);
                    }
                }
                setLoading(false);
            }
        };

        const image1 = image1Ref.current;
        const image2 = image2Ref.current;

        if (image1 && image2) {
            if (image1.complete && image2.complete) {
                checkAndSetImage();
            } else {
                setLoading(true);
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
    }, [reverse]);

    return (
        <>
            {loading && <Skeleton.Image active={true} />}
            <Image
                ref={image1Ref}
                src={url1}
                alt={alt}
                fill
                sizes={`(max-width: ${width}px) 100vw, ${width}px`}
                style={{ opacity: showImage1 && !loading ? 1 : 0, ...style }}
                className={showImage1 ? className : ''}
                quality={quality}
            />
            <Image
                ref={image2Ref}
                src={url2}
                alt={alt}
                fill
                sizes={`(max-width: ${width}px) 100vw, ${width}px`}
                style={{ opacity: !showImage1 && !loading ? 1 : 0, ...style }}
                className={!showImage1 ? className : ''}
                quality={quality}
            />
        </>
    );
}
