import React, { useState, useEffect, CSSProperties } from 'react';
import { Image as AntdImage } from 'antd';

export type HigherHeightImageProps = {
    url1: string;
    url2: string;
    alt: string;
    style?: CSSProperties;
    className?: string;
    reverse?: boolean;
};

export const HigherHeightImage = ({
    url1,
    url2,
    alt,
    style,
    className,
    reverse = false,
}: HigherHeightImageProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const img1 = new Image();
        const img2 = new Image();

        let img1Loaded = false;
        let img2Loaded = false;

        const checkAndSetImage = () => {
            if (img1Loaded && img2Loaded) {
                const isImage1Vertical = img1.height > img1.width;
                const isImage2Vertical = img2.height > img2.width;

                if (reverse) {
                    // If reverse is true, choose the horizontal image
                    if (!isImage1Vertical && !isImage2Vertical) {
                        // If both are horizontal, choose either (e.g., url1)
                        setImageUrl(url1);
                    } else {
                        // Choose the horizontal one
                        setImageUrl(isImage1Vertical ? url2 : url1);
                    }
                } else {
                    // If reverse is false (default), choose the vertical image
                    if (isImage1Vertical || isImage2Vertical) {
                        // Choose the vertical image
                        setImageUrl(isImage1Vertical ? url1 : url2);
                    } else {
                        // If both are horizontal, choose either (e.g., url1)
                        setImageUrl(url1);
                    }
                }
            }
        };

        img1.onload = () => {
            img1Loaded = true;
            checkAndSetImage();
        };
        img1.src = url1;

        img2.onload = () => {
            img2Loaded = true;
            checkAndSetImage();
        };
        img2.src = url2;
    }, [url1, url2, reverse]);

    return imageUrl && <AntdImage src={imageUrl} alt={alt} style={style} className={className} />;
};
