import React, { useEffect, ReactNode } from 'react';
import { Typography } from 'antd';

import { MovieQualityEnum, MovieContentRatingEnum } from 'apps/api/src/app/movies/movie.constant';

import { MovieQualityTag } from '../tag/movie-quality';
import { MovieContentRating, getContentRatingDescription } from '../tag/movie-content-rating';
import { AuthRequirementModal, ModalType } from './auth-requirement-modal';

const { Text } = Typography;

interface AgeVerificationModalProps {
    visible: boolean;
    onClose: () => void;
    onAccept: () => void;
    contentRating?: string;
    quality?: string;
    isLoggedIn: boolean;
    maskClosable?: boolean;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
    visible,
    onClose,
    onAccept,
    contentRating,
    quality,
    isLoggedIn,
    maskClosable = false,
}) => {
    // Check for restricted content that needs verification
    const isRestrictedContent =
        contentRating === MovieContentRatingEnum.T16 ||
        contentRating === MovieContentRatingEnum.T18 ||
        contentRating === MovieContentRatingEnum.C;

    const isGeneralContent = contentRating === MovieContentRatingEnum.P || !contentRating;
    const isHighQuality = quality === MovieQualityEnum._4K || quality === MovieQualityEnum.FHD;

    // Content requires verification if it's high quality or age-restricted (and not general content)
    const needsVerification = isHighQuality || (isRestrictedContent && !isGeneralContent);

    // Auto-accept for non-restricted content
    useEffect(() => {
        if (visible && !needsVerification) {
            onAccept();
        }
    }, [visible, needsVerification, onAccept]);

    // Get content rating title and description
    const getRatingInfo = (): { title: ReactNode; description: ReactNode } => {
        if (!contentRating) {
            return {
                title: 'Xác nhận độ tuổi',
                description: 'Nội dung này yêu cầu xác nhận trước khi xem.',
            };
        }

        return {
            title: (
                <>
                    {getContentRatingTitle(contentRating)}{' '}
                    <MovieContentRating rating={contentRating} />
                </>
            ),
            description: (
                <>
                    {getContentRatingDescription(contentRating)}
                    {quality && (
                        <div style={{ marginTop: 8 }}>
                            Chất lượng phim: <MovieQualityTag quality={quality} />
                        </div>
                    )}
                </>
            ),
        };
    };

    // Get content rating specific reasons for login
    const getLoginReasons = (): ReactNode[] => {
        const reasons: ReactNode[] = [
            <span key="base">Nội dung này yêu cầu xác thực độ tuổi trước khi xem.</span>,
        ];

        if (contentRating !== MovieContentRatingEnum.P) {
            reasons.push(
                <span key={`rating-${contentRating}`}>
                    Phân loại <MovieContentRating rating={contentRating} />-{' '}
                    {getRatingReasonText(contentRating)}
                </span>,
            );
        }

        if (isHighQuality) {
            reasons.push(
                <span key="quality">
                    Nội dung chất lượng <MovieQualityTag quality={quality} />
                    cần được bảo vệ khỏi lạm dụng.
                </span>,
            );
        }

        reasons.push(
            <span key="login">
                Đăng nhập giúp chúng tôi xác minh danh tính và độ tuổi của bạn.
            </span>,
        );

        return reasons;
    };

    // Get content rating specific agreement terms
    const getAgreementReasons = (): ReactNode[] => {
        const reasons: ReactNode[] = [
            <span key="agree-resp">Tôi hoàn toàn chịu trách nhiệm về việc xem nội dung này</span>,
        ];

        if (contentRating) {
            reasons.push(
                <span key={`agree-${contentRating}`}>{getAgreementText(contentRating)}</span>,
            );
        }

        reasons.push(
            <span key="agree-understand">
                Tôi đã hiểu rõ về phân loại <MovieContentRating rating={contentRating} />
                và nội dung có thể xuất hiện
            </span>,
        );

        return reasons;
    };

    // Information about content rating for authenticated users
    const getContentRestrictionInfo = (): ReactNode[] => {
        const info: ReactNode[] = [];

        if (isRestrictedContent && contentRating) {
            info.push(
                <span key={`info-${contentRating}`}>
                    Phân loại <Text strong>{contentRating.toUpperCase()}</Text> -{' '}
                    {getRatingReasonText(contentRating)}
                </span>,
            );
        }

        if (isHighQuality) {
            info.push(
                <span key="info-quality">
                    Nội dung có chất lượng <MovieQualityTag quality={quality} />
                    cần được xác nhận quyền truy cập.
                </span>,
            );
        }

        return info;
    };

    const ratingInfo = getRatingInfo();

    return (
        <AuthRequirementModal
            visible={visible && needsVerification}
            onClose={onClose}
            onAccept={onAccept}
            isLoggedIn={isLoggedIn}
            type={ModalType.AGE_VERIFICATION}
            title={ratingInfo.title}
            primaryMessage="Xác nhận độ tuổi và trách nhiệm xem nội dung"
            primaryDescription={ratingInfo.description}
            secondaryMessage="Đăng nhập bắt buộc"
            secondaryDescription="Nội dung này yêu cầu xác thực người dùng trước khi xem."
            reasonList={isLoggedIn ? getContentRestrictionInfo() : getLoginReasons()}
            checkboxText="Tôi cam kết và xác nhận rằng:"
            acceptButtonText="Tiếp tục xem phim"
            requiresAgreement={isLoggedIn}
            agreementList={isLoggedIn ? getAgreementReasons() : []}
            maskClosable={maskClosable}
        />
    );
};

// Helper functions to reduce duplication
function getContentRatingTitle(rating: string): string {
    switch (rating) {
        case MovieContentRatingEnum.P:
            return 'Nội dung phổ biến';
        case MovieContentRatingEnum.K:
            return 'Nội dung thiếu nhi';
        case MovieContentRatingEnum.T13:
            return 'Nội dung 13+';
        case MovieContentRatingEnum.T16:
            return 'Nội dung 16+';
        case MovieContentRatingEnum.T18:
            return 'Nội dung 18+';
        case MovieContentRatingEnum.C:
            return 'Nội dung hạn chế';
        default:
            return 'Xác nhận độ tuổi';
    }
}

function getRatingReasonText(rating: string): string {
    switch (rating) {
        case MovieContentRatingEnum.K:
            return 'Dành cho người xem dưới 13 tuổi có sự hướng dẫn hoặc giám sát của người lớn.';
        case MovieContentRatingEnum.T13:
            return 'Chỉ phù hợp cho người xem từ 13 tuổi trở lên.';
        case MovieContentRatingEnum.T16:
            return 'Chỉ phù hợp cho người xem từ 16 tuổi trở lên. Nội dung có thể chứa các yếu tố phức tạp.';
        case MovieContentRatingEnum.T18:
            return 'Chỉ phù hợp cho người xem từ 18 tuổi trở lên. Nội dung có thể chứa các yếu tố nhạy cảm.';
        case MovieContentRatingEnum.C:
            return 'Nội dung hạn chế, không được phép phổ biến rộng rãi và chỉ phù hợp cho người lớn.';

        case MovieContentRatingEnum.P:
        default:
            return '';
    }
}

function getAgreementText(rating: string): string {
    switch (rating) {
        case MovieContentRatingEnum.K:
            return 'Tôi xác nhận đã có sự giám sát hoặc hướng dẫn phù hợp cho người xem dưới 13 tuổi';
        case MovieContentRatingEnum.T13:
            return 'Tôi xác nhận người xem đã đủ 13 tuổi trở lên và phù hợp với nội dung này';
        case MovieContentRatingEnum.T16:
            return 'Tôi đã đủ 16 tuổi trở lên và hiểu rằng nội dung này có thể có các yếu tố phức tạp';
        case MovieContentRatingEnum.T18:
            return 'Tôi đã đủ 18 tuổi trở lên và hiểu rằng nội dung này có thể chứa các yếu tố nhạy cảm';
        case MovieContentRatingEnum.C:
            return 'Tôi đã đủ 18 tuổi trở lên và hiểu rằng đây là nội dung bị hạn chế phổ biến rộng rãi';
        default:
            return '';
    }
}
