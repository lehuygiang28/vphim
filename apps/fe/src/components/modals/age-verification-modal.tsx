import React, { useState, useEffect, ReactNode } from 'react';
import { Modal, Typography, Alert, Checkbox, Button, Divider } from 'antd';
import {
    WarningOutlined,
    LockOutlined,
    LoginOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { MovieQualityEnum, MovieContentRatingEnum } from 'apps/api/src/app/movies/movie.constant';

import { MovieQualityTag } from '../tag/movie-quality';
import { MovieContentRating } from '../tag/movie-content-rating';

const { Title, Text, Paragraph } = Typography;

interface AgeVerificationModalProps {
    visible: boolean;
    onClose: () => void;
    onAccept: () => void;
    contentRating?: string;
    quality?: string;
    isLoggedIn: boolean;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
    visible,
    onClose,
    onAccept,
    contentRating,
    quality,
    isLoggedIn,
}) => {
    const [agreeTerms, setAgreeTerms] = useState(false);
    const router = useRouter();

    // Add check for general content that doesn't need verification
    const isRestrictedContent =
        contentRating === 'T16' || contentRating === 'T18' || contentRating === 'C';

    // Only P rating should be exempt from verification
    const isGeneralContent = contentRating === 'P' || !contentRating;

    const getContentRatingInfo = (
        rating?: string,
    ): { title: ReactNode; description: ReactNode } => {
        switch (rating) {
            case 'P':
                return {
                    title: (
                        <>
                            Nội dung phổ biến{' '}
                            <MovieContentRating rating={MovieContentRatingEnum.P} />
                        </>
                    ),
                    description:
                        'Phim không có hạn chế độ tuổi, phù hợp để phổ biến đến mọi đối tượng khán giả. Nội dung được xây dựng mang tính chất giáo dục và giải trí phổ quát.',
                };
            case 'K':
                return {
                    title: (
                        <>
                            Nội dung thiếu nhi{' '}
                            <MovieContentRating rating={MovieContentRatingEnum.K} />
                        </>
                    ),
                    description:
                        'Phim được chiếu đến người xem dưới 13 tuổi, với điều kiện là phải có sự hướng dẫn hoặc sự giám sát từ phía cha, mẹ hoặc người giám hộ.',
                };
            case 'T13':
                return {
                    title: (
                        <>
                            Nội dung 13+ <MovieContentRating rating={MovieContentRatingEnum.T13} />
                        </>
                    ),
                    description:
                        'Phim phù hợp cho đối tượng từ 13 tuổi trở lên. Những tác phẩm này có thể chứa những yếu tố nội dung phức tạp hơn, phù hợp với sự hiểu biết và trí tuệ của khán giả trong độ tuổi này.',
                };
            case 'T16':
                return {
                    title: (
                        <>
                            Nội dung 16+ <MovieContentRating rating={MovieContentRatingEnum.T16} />
                        </>
                    ),
                    description:
                        'Phim được phổ biến đến người xem từ 16 tuổi trở lên. Nội dung có thể chứa các yếu tố phức tạp, thách thức trí tuệ và sự hiểu biết của đối tượng khán giả này.',
                };
            case 'T18':
                return {
                    title: (
                        <>
                            Nội dung 18+ <MovieContentRating rating={MovieContentRatingEnum.T18} />
                        </>
                    ),
                    description:
                        'Phim dành cho người xem từ 18 tuổi trở lên. Đây là những tác phẩm có nội dung chủ yếu dành cho đối tượng người lớn, có thể chứa những yếu tố nội dung nhạy cảm.',
                };
            case 'C':
                return {
                    title: (
                        <>
                            Nội dung hạn chế{' '}
                            <MovieContentRating rating={MovieContentRatingEnum.C} />
                        </>
                    ),
                    description:
                        'Loại phim không được phép phổ biến rộng rãi, nội dung không đáp ứng được các tiêu chí quy định và không phù hợp để đưa ra công chúng.',
                };
            default:
                return {
                    title: 'Xác nhận độ tuổi',
                    description: 'Nội dung này yêu cầu xác nhận trước khi xem.',
                };
        }
    };

    const ratingInfo = getContentRatingInfo(contentRating);
    const needsLogin = !isLoggedIn;
    const isHighQuality = quality === MovieQualityEnum._4K || quality === MovieQualityEnum.FHD;
    // Skip verification for general public content (P) ONLY if it's not high quality
    const needsVerification = isHighQuality || (isRestrictedContent && !isGeneralContent);

    // Auto-accept for non-restricted content
    useEffect(() => {
        if (visible && !needsVerification) {
            onAccept();
        }
    }, [
        visible,
        needsVerification,
        onAccept,
        isRestrictedContent,
        isGeneralContent,
        contentRating,
        quality,
        isHighQuality,
    ]);

    const handleLogin = () => {
        router.push(`/dang-nhap?to=${encodeURIComponent(window.location.href)}`);
    };

    return (
        <Modal
            open={visible && needsVerification}
            centered
            closable={false}
            footer={null}
            width={480}
            maskClosable={false}
            bodyStyle={{ padding: '24px', borderRadius: '12px' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <WarningOutlined
                    style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}
                />
                <Title level={4} style={{ margin: '0 0 8px' }}>
                    {ratingInfo.title}
                </Title>
            </div>

            <Alert
                message="Xác nhận độ tuổi và trách nhiệm xem nội dung"
                description={
                    <>
                        {ratingInfo.description}
                        {quality && (
                            <div style={{ marginTop: 8 }}>
                                Chất lượng phim: <MovieQualityTag quality={quality} />
                            </div>
                        )}
                    </>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '20px' }}
            />

            {needsLogin && (
                <>
                    <Alert
                        message="Đăng nhập bắt buộc"
                        description="Nội dung này yêu cầu xác thực người dùng trước khi xem."
                        type="error"
                        showIcon
                        icon={<LockOutlined />}
                        style={{ marginBottom: '20px' }}
                    />

                    <div
                        style={{
                            border: '1px solid #f0f0f0',
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                            marginBottom: '16px',
                        }}
                    >
                        <Paragraph style={{ marginBottom: '16px' }}>
                            <Text strong style={{ fontSize: '15px' }}>
                                Tại sao cần đăng nhập?
                            </Text>
                        </Paragraph>

                        <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0' }}>
                            <li>Nội dung này yêu cầu xác thực độ tuổi trước khi xem.</li>
                            {contentRating === 'K' && (
                                <li>
                                    Phân loại{' '}
                                    <MovieContentRating rating={MovieContentRatingEnum.K} /> - Dành
                                    cho người xem dưới 13 tuổi có sự hướng dẫn hoặc giám sát của
                                    người lớn.
                                </li>
                            )}
                            {contentRating === 'T13' && (
                                <li>
                                    Phân loại{' '}
                                    <MovieContentRating rating={MovieContentRatingEnum.T13} /> - Chỉ
                                    phù hợp cho người xem từ 13 tuổi trở lên.
                                </li>
                            )}
                            {contentRating === 'T16' && (
                                <li>
                                    Phân loại{' '}
                                    <MovieContentRating rating={MovieContentRatingEnum.T16} /> - Chỉ
                                    phù hợp cho người xem từ 16 tuổi trở lên. Nội dung có thể chứa
                                    các yếu tố phức tạp.
                                </li>
                            )}
                            {contentRating === 'T18' && (
                                <li>
                                    Phân loại{' '}
                                    <MovieContentRating rating={MovieContentRatingEnum.T18} /> - Chỉ
                                    phù hợp cho người xem từ 18 tuổi trở lên. Nội dung có thể chứa
                                    các yếu tố nhạy cảm.
                                </li>
                            )}
                            {contentRating === 'C' && (
                                <li>
                                    Phân loại{' '}
                                    <MovieContentRating rating={MovieContentRatingEnum.C} /> - Nội
                                    dung hạn chế, không được phép phổ biến rộng rãi và chỉ phù hợp
                                    cho người lớn.
                                </li>
                            )}
                            {isHighQuality && (
                                <li>
                                    Nội dung chất lượng <MovieQualityTag quality={quality} />
                                    cần được bảo vệ quyền sở hữu và tránh lạm dụng.
                                </li>
                            )}
                            <li>Đăng nhập giúp chúng tôi xác minh danh tính và độ tuổi của bạn.</li>
                        </ul>

                        <Paragraph style={{ textAlign: 'center' }}>
                            <Text>Vui lòng đăng nhập để tiếp tục xem phim</Text>
                        </Paragraph>
                    </div>
                </>
            )}

            {!needsLogin && (
                <>
                    <Alert
                        message="Xác nhận độ tuổi theo tiêu chuẩn phân loại phim Việt Nam"
                        description={
                            <>
                                Nội dung này được phân loại{' '}
                                {contentRating ? (
                                    <MovieContentRating rating={contentRating} />
                                ) : (
                                    'không xác định'
                                )}{' '}
                                và yêu cầu xác nhận độ tuổi từ người xem.
                            </>
                        }
                        type="warning"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                        style={{ marginBottom: '20px' }}
                    />

                    <div
                        style={{
                            border: '1px solid #f0f0f0',
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                            marginBottom: '16px',
                        }}
                    >
                        <Paragraph style={{ marginBottom: '16px' }}>
                            <Text strong>Thông tin về phân loại nội dung:</Text>
                        </Paragraph>

                        <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0' }}>
                            {contentRating === 'T16' && (
                                <li>
                                    Phân loại <Text strong>T16</Text> - Chỉ phù hợp cho người xem từ
                                    16 tuổi trở lên.
                                </li>
                            )}
                            {contentRating === 'T18' && (
                                <li>
                                    Phân loại <Text strong>T18</Text> - Chỉ phù hợp cho người xem từ
                                    18 tuổi trở lên.
                                </li>
                            )}
                            {contentRating === 'C' && (
                                <li>
                                    Phân loại <Text strong>C</Text> - Nội dung hạn chế, chỉ phù hợp
                                    cho người lớn.
                                </li>
                            )}
                            {isHighQuality && (
                                <li>
                                    Nội dung có chất lượng <MovieQualityTag quality={quality} /> cần
                                    được xác nhận quyền truy cập.
                                </li>
                            )}
                        </ul>
                    </div>

                    <Checkbox
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                    >
                        <Text>Tôi cam kết và xác nhận rằng:</Text>
                    </Checkbox>

                    <div style={{ marginLeft: '24px', marginTop: '8px', marginBottom: '16px' }}>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {contentRating === 'K' && (
                                <li>
                                    Tôi xác nhận đã có sự giám sát hoặc hướng dẫn phù hợp cho người
                                    xem dưới 13 tuổi
                                </li>
                            )}
                            {contentRating === 'T13' && (
                                <li>
                                    Tôi xác nhận người xem đã đủ 13 tuổi trở lên và phù hợp với nội
                                    dung này
                                </li>
                            )}
                            {contentRating === 'T16' && (
                                <li>
                                    Tôi đã đủ 16 tuổi trở lên và hiểu rằng nội dung này có thể có
                                    các yếu tố phức tạp
                                </li>
                            )}
                            {contentRating === 'T18' && (
                                <li>
                                    Tôi đã đủ 18 tuổi trở lên và hiểu rằng nội dung này có thể chứa
                                    các yếu tố nhạy cảm
                                </li>
                            )}
                            {contentRating === 'C' && (
                                <li>
                                    Tôi đã đủ 18 tuổi trở lên và hiểu rằng đây là nội dung bị hạn
                                    chế phổ biến rộng rãi
                                </li>
                            )}
                            {(contentRating === 'P' ||
                                contentRating === 'K' ||
                                contentRating === 'T13') &&
                                isHighQuality && (
                                    <li>
                                        Tôi hiểu rằng đây là nội dung chất lượng cao và cam kết
                                        không sử dụng vào mục đích trái phép
                                    </li>
                                )}
                            <li>Tôi hoàn toàn chịu trách nhiệm về việc xem nội dung này</li>
                            <li>
                                Tôi đã hiểu rõ về phân loại{' '}
                                <MovieContentRating rating={contentRating} /> và nội dung có thể
                                xuất hiện
                            </li>
                            {isHighQuality && (
                                <li>
                                    Tôi cam kết không sao chép, phát tán hoặc chia sẻ nội dung chất
                                    lượng <MovieQualityTag quality={quality} />
                                </li>
                            )}
                        </ul>
                    </div>
                </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onClose}>Quay lại</Button>
                {needsLogin ? (
                    <Button type="primary" icon={<LoginOutlined />} onClick={handleLogin}>
                        Đăng nhập ngay
                    </Button>
                ) : (
                    <Button type="primary" disabled={!agreeTerms} onClick={onAccept}>
                        Tiếp tục xem phim
                    </Button>
                )}
            </div>
        </Modal>
    );
};
