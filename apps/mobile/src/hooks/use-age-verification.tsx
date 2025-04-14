import { useState, useEffect, useCallback } from 'react';
import { MovieContentRatingEnum, MovieQualityEnum } from 'apps/api/src/app/movies/movie.constant';
import { useAuth } from './use-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Restricted content types that require verification
const RESTRICTED_RATINGS = [
    MovieContentRatingEnum.C,
    MovieContentRatingEnum.K,
    MovieContentRatingEnum.T13,
    MovieContentRatingEnum.T16,
    MovieContentRatingEnum.T18,
];

// Non-restricted content that should never need verification
const UNRESTRICTED_RATINGS = [MovieContentRatingEnum.P];

const RESTRICTED_QUALITIES = [MovieQualityEnum._4K, MovieQualityEnum.FHD];

// AsyncStorage key to avoid showing the modal again in the same session
const AGE_VERIFICATION_KEY = 'vphim_age_verified';

type VerificationState = {
    [key: string]: boolean;
};

export const useAgeVerification = (contentRating?: string, quality?: string) => {
    const { isAuthenticated } = useAuth();
    const [needsVerification, setNeedsVerification] = useState<boolean>(false);
    const [isVerificationModalVisible, setIsVerificationModalVisible] = useState<boolean>(false);
    const [verifiedContent, setVerifiedContent] = useState<VerificationState>({});
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Generate a unique key for the content
    const getContentVerificationKey = useCallback(
        (contentRating?: string, quality?: string): string => {
            return `${contentRating?.toLowerCase() || 'none'}_${quality?.toLowerCase() || 'none'}`;
        },
        [],
    );

    // Check if content needs verification
    const checkContentRestriction = useCallback(
        (contentRating?: string, quality?: string): boolean => {
            // If no content rating or quality provided, default to unrestricted
            if (!contentRating && !quality) return false;

            // Normalize content rating to lowercase to match enum values
            const normalizedRating = contentRating?.toLowerCase();
            const normalizedQuality = quality?.toLowerCase();

            // Check quality restriction first - high quality always needs verification
            const needsQualityRestriction =
                normalizedQuality &&
                RESTRICTED_QUALITIES.includes(normalizedQuality as MovieQualityEnum);

            // If it's high quality, always require verification
            if (needsQualityRestriction) {
                return true;
            }

            // If it's explicitly a non-restricted rating, it doesn't need verification
            if (
                normalizedRating &&
                UNRESTRICTED_RATINGS.includes(normalizedRating as MovieContentRatingEnum)
            ) {
                return false;
            }

            // Check content rating restriction
            const needsContentRatingRestriction = !!(
                normalizedRating &&
                RESTRICTED_RATINGS.includes(normalizedRating as MovieContentRatingEnum)
            );

            return needsContentRatingRestriction;
        },
        [],
    );

    // Load verified content and initialize states
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            // Load verified content from AsyncStorage
            try {
                const storedData = await AsyncStorage.getItem(AGE_VERIFICATION_KEY);
                if (storedData && isMounted) {
                    setVerifiedContent(JSON.parse(storedData));
                }
            } catch (error) {
                console.error('Error loading verification state:', error);
            }

            if (!isMounted) return;

            // Determine if verification is needed
            const isRestricted = checkContentRestriction(contentRating, quality);

            if (!isRestricted) {
                setNeedsVerification(false);
                setIsInitialized(true);
                return;
            }

            const hasVerifiedBefore =
                getContentVerificationKey(contentRating, quality) in verifiedContent;

            const needsToVerify =
                isRestricted && (!isAuthenticated || (isAuthenticated && !hasVerifiedBefore));

            setNeedsVerification(needsToVerify);

            // Add a small delay before showing the modal to prevent flickering
            if (needsToVerify) {
                setTimeout(() => {
                    if (isMounted) {
                        setIsVerificationModalVisible(true);
                    }
                }, 50);
            }

            setIsInitialized(true);
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [
        contentRating,
        quality,
        isAuthenticated,
        verifiedContent,
        checkContentRestriction,
        getContentVerificationKey,
    ]);

    // Mark content as verified and store in AsyncStorage
    const markContentAsVerified = async () => {
        const key = getContentVerificationKey(contentRating, quality);
        const newVerifiedContent = {
            ...verifiedContent,
            [key]: true,
        };

        setVerifiedContent(newVerifiedContent);

        try {
            await AsyncStorage.setItem(AGE_VERIFICATION_KEY, JSON.stringify(newVerifiedContent));
        } catch (error) {
            console.error('Error saving verification state:', error);
        }

        setIsVerificationModalVisible(false);
        setNeedsVerification(false);
    };

    // Show the verification modal on demand
    const showVerificationModal = () => {
        setIsVerificationModalVisible(true);
    };

    // Hide the verification modal
    const hideVerificationModal = () => {
        setIsVerificationModalVisible(false);
    };

    return {
        needsVerification,
        isVerificationModalVisible,
        showVerificationModal,
        hideVerificationModal,
        markContentAsVerified,
        checkContentRestriction,
        isInitialized,
    };
};
