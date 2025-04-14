import React, { ReactNode, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Card, Text, Button, Divider, CheckBox, useTheme } from '@ui-kitten/components';
import { useRouter } from 'expo-router';
import { MovieContentRatingEnum, MovieQualityEnum } from 'apps/api/src/app/movies/movie.constant';
import { AlertTriangle, Lock, Shield, CheckCircle } from 'lucide-react-native';
import { MovieQualityTag, getQualityColor, formatQuality } from '../tag/movie-quality';
import {
    MovieContentRating,
    getContentRatingDescription,
    getRatingColor,
    getFormattedRating,
} from '../tag/movie-content-rating';

interface AgeVerificationModalProps {
    visible: boolean;
    onClose: () => void;
    onAccept: () => void;
    contentRating?: string;
    quality?: string;
    isAuthenticated: boolean;
    maskClosable?: boolean;
    // Feature access mode props
    featureAccess?: boolean;
    title?: string;
    primaryMessage?: string;
    primaryDescription?: string;
    reasonList?: string[];
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
    visible,
    onClose,
    onAccept,
    contentRating,
    quality,
    isAuthenticated,
    maskClosable = false,
    // Feature access props
    featureAccess = false,
    title: customTitle,
    primaryMessage,
    primaryDescription,
    reasonList = [],
}) => {
    const theme = useTheme();
    const [agreeTerms, setAgreeTerms] = useState(false);
    const router = useRouter();

    // Check for restricted content that needs verification
    const isRestrictedContent =
        contentRating === MovieContentRatingEnum.T16 ||
        contentRating === MovieContentRatingEnum.T18 ||
        contentRating === MovieContentRatingEnum.C;

    const isGeneralContent = contentRating === MovieContentRatingEnum.P || !contentRating;
    const isHighQuality = quality === MovieQualityEnum._4K || quality === MovieQualityEnum.FHD;

    // Content requires verification if it's high quality or age-restricted (and not general content)
    const needsVerification = featureAccess || isHighQuality || (isRestrictedContent && !isGeneralContent);

    // Get content rating title and description
    const getRatingInfo = (): { title: string; description: ReactNode } => {
        if (featureAccess) {
            return {
                title: customTitle || 'Tính năng yêu cầu đăng nhập',
                description: primaryDescription || 'Tính năng này yêu cầu xác thực người dùng trước khi sử dụng.',
            };
        }

        if (!contentRating) {
            return {
                title: 'Xác nhận độ tuổi',
                description: 'Nội dung này yêu cầu xác nhận trước khi xem.',
            };
        }

        return {
            title: getContentRatingTitle(contentRating),
            description: (
                <>
                    <Text
                        category="p1"
                        style={[styles.descriptionText, { color: theme['text-basic-color'] }]}
                    >
                        {getContentRatingDescription(contentRating)}
                    </Text>
                    {quality && (
                        <View style={styles.tagRow}>
                            <Text
                                category="p1"
                                style={{ marginRight: 8, color: theme['text-basic-color'] }}
                            >
                                Chất lượng phim:
                            </Text>
                            <MovieQualityTag quality={quality} />
                        </View>
                    )}
                </>
            ),
        };
    };

    // Get content rating specific reasons for login
    const getLoginReasons = (): ReactNode[] => {
        if (featureAccess && reasonList.length > 0) {
            return reasonList.map((reason, index) => (
                <Text key={`feature-${index}`} style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                    {reason}
                </Text>
            ));
        }

        const reasons: ReactNode[] = [
            <Text key="base" style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                Nội dung này yêu cầu xác thực độ tuổi trước khi xem.
            </Text>,
        ];

        if (contentRating && contentRating !== MovieContentRatingEnum.P) {
            reasons.push(
                <View key={`rating-${contentRating}`} style={styles.tagRow}>
                    <Text style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                        Phân loại{' '}
                        <Text
                            style={{
                                color: contentRating
                                    ? getRatingColor(contentRating, theme)
                                    : theme['color-primary-500'],
                            }}
                        >
                            {contentRating ? getFormattedRating(contentRating) : ''}
                        </Text>{' '}
                        - {getRatingReasonText(contentRating)}
                    </Text>
                </View>,
            );
        }

        if (isHighQuality && quality) {
            reasons.push(
                <View key="quality" style={styles.tagRow}>
                    <Text style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                        Nội dung chất lượng{' '}
                        <Text
                            style={{
                                color: quality
                                    ? getQualityColor(quality, theme)
                                    : theme['color-success-500'],
                            }}
                        >
                            {quality ? formatQuality(quality) : ''}
                        </Text>{' '}
                        cần được bảo vệ khỏi lạm dụng.
                    </Text>
                </View>,
            );
        }

        reasons.push(
            <Text key="login" style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                Đăng nhập giúp chúng tôi xác minh danh tính và độ tuổi của bạn.
            </Text>,
        );

        return reasons;
    };

    // Get content rating specific agreement terms
    const getAgreementReasons = (): ReactNode[] => {
        const reasons: ReactNode[] = [
            <Text
                key="agree-resp"
                style={[styles.reasonText, { color: theme['text-basic-color'] }]}
            >
                <CheckCircle size={16} color={theme['color-success-500']} /> Tôi hoàn toàn chịu
                trách nhiệm về việc xem nội dung này
            </Text>,
        ];

        if (contentRating) {
            reasons.push(
                <Text
                    key={`agree-${contentRating}`}
                    style={[styles.reasonText, { color: theme['text-basic-color'] }]}
                >
                    <CheckCircle size={16} color={theme['color-success-500']} />{' '}
                    {getAgreementText(contentRating)}
                </Text>,
            );
        }

        if (contentRating) {
            reasons.push(
                <Text
                    key="agree-understand"
                    style={[styles.reasonText, { color: theme['text-basic-color'] }]}
                >
                    <CheckCircle size={16} color={theme['color-success-500']} /> Tôi đã hiểu rõ về
                    phân loại{' '}
                    <Text style={[{ color: getRatingColor(contentRating, theme) }]}>
                        {getFormattedRating(contentRating)}
                    </Text>{' '}
                    và nội dung có thể xuất hiện
                </Text>,
            );
        }

        return reasons;
    };

    // Information about content rating for authenticated users
    const getContentRestrictionInfo = (): ReactNode[] => {
        const info: ReactNode[] = [];

        if (isRestrictedContent && contentRating) {
            info.push(
                <View key={`info-${contentRating}`} style={styles.tagRow}>
                    <Text style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                        Phân loại{' '}
                        <Text style={[{ color: getRatingColor(contentRating, theme) }]}>
                            {getFormattedRating(contentRating)}
                        </Text>{' '}
                        - {getRatingReasonText(contentRating)}
                    </Text>
                </View>,
            );
        }

        if (isHighQuality && quality) {
            info.push(
                <View key="info-quality" style={styles.tagRow}>
                    <Text style={[styles.reasonText, { color: theme['text-basic-color'] }]}>
                        Nội dung có chất lượng{' '}
                        <Text style={[{ color: getQualityColor(quality, theme) }]}>
                            {formatQuality(quality)}
                        </Text>{' '}
                        cần được xác nhận quyền truy cập.
                    </Text>
                </View>,
            );
        }

        return info;
    };

    const ratingInfo = getRatingInfo();

    // Handle login redirection with an immediately visible feedback
    const handleLogin = useCallback(() => {
        // Ensure onClose is called first to dismiss modal
        onClose();

        router.push('/auth');
    }, [onClose, router]);

    // Handle back button
    const handleBackPress = useCallback(() => {
        onClose();
    }, [onClose]);

    // Fix for icon with props
    const LoginIcon = () => (
        <View style={{ marginRight: 4 }}>
            <Lock size={18} color={theme['text-control-color']} />
        </View>
    );

    return (
        <Modal
            visible={visible}
            backdropStyle={styles.backdrop}
            onBackdropPress={maskClosable ? onClose : undefined}
            style={styles.modalContainer}
        >
            <Card
                disabled
                style={[styles.card, { backgroundColor: theme['background-basic-color-1'] }]}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        {featureAccess ? (
                            <Lock size={48} color={theme['color-primary-500']} />
                        ) : (
                            <AlertTriangle size={48} color={theme['color-danger-500']} />
                        )}
                        <Text
                            category="h5"
                            style={[styles.title, { color: theme['text-basic-color'] }]}
                        >
                            {ratingInfo.title}
                        </Text>
                        {!featureAccess && (
                            <View style={styles.headerTags}>
                                {contentRating && <MovieContentRating rating={contentRating} />}
                                {quality && <MovieQualityTag quality={quality} />}
                            </View>
                        )}
                    </View>

                    <View style={[
                        styles.alert,
                        {
                            backgroundColor: featureAccess
                                ? theme['color-info-200']
                                : theme['color-warning-200']
                        }
                    ]}>
                        <View style={styles.alertHeader}>
                            <Shield
                                size={20}
                                color={featureAccess
                                    ? theme['color-info-700']
                                    : theme['color-warning-700']}
                                style={{ marginRight: 8 }}
                            />
                            <Text
                                category="s1"
                                style={{
                                    color: featureAccess
                                        ? theme['color-info-900']
                                        : theme['color-warning-900'],
                                    fontWeight: 'bold',
                                }}
                            >
                                {featureAccess
                                    ? (primaryMessage || 'Yêu cầu đăng nhập')
                                    : 'Xác nhận độ tuổi và trách nhiệm'}
                            </Text>
                        </View>
                        <View style={styles.alertContent}>
                            {typeof ratingInfo.description === 'string' ? (
                                <Text style={{
                                    color: featureAccess
                                        ? theme['color-info-900']
                                        : theme['color-warning-900']
                                }}>
                                    {ratingInfo.description}
                                </Text>
                            ) : (
                                ratingInfo.description
                            )}
                        </View>
                    </View>

                    {!isAuthenticated && (
                        <View
                            style={[styles.alert, { backgroundColor: theme['color-danger-200'] }]}
                        >
                            <View style={styles.alertHeader}>
                                <Lock
                                    size={20}
                                    color={theme['color-danger-700']}
                                    style={{ marginRight: 8 }}
                                />
                                <Text
                                    category="s1"
                                    style={{
                                        color: theme['color-danger-900'],
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Đăng nhập bắt buộc
                                </Text>
                            </View>
                            <Text style={{ color: theme['color-danger-900'] }}>
                                {featureAccess
                                    ? 'Tính năng này yêu cầu xác thực người dùng trước khi sử dụng.'
                                    : 'Nội dung này yêu cầu xác thực người dùng trước khi xem.'}
                            </Text>
                        </View>
                    )}

                    <View
                        style={[
                            styles.infoSection,
                            { backgroundColor: theme['background-basic-color-2'] },
                        ]}
                    >
                        <Text
                            category="s1"
                            style={{
                                fontWeight: 'bold',
                                marginBottom: 10,
                                color: theme['text-basic-color'],
                            }}
                        >
                            Tại sao cần {!isAuthenticated ? 'đăng nhập' : 'xác nhận'}?
                        </Text>

                        {isAuthenticated ? (
                            <View style={styles.reasonList}>
                                {getContentRestrictionInfo().map((info, index) => (
                                    <View key={index} style={styles.reasonItem}>
                                        <View
                                            style={[
                                                styles.bullet,
                                                { backgroundColor: theme['color-primary-500'] },
                                            ]}
                                        />
                                        <View style={styles.reasonTextContainer}>{info}</View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.reasonList}>
                                {getLoginReasons().map((reason, index) => (
                                    <View key={index} style={styles.reasonItem}>
                                        <View
                                            style={[
                                                styles.bullet,
                                                { backgroundColor: theme['color-primary-500'] },
                                            ]}
                                        />
                                        <View style={styles.reasonTextContainer}>{reason}</View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text
                            style={{
                                textAlign: 'center',
                                marginTop: 12,
                                fontStyle: 'italic',
                                color: theme['text-hint-color'],
                            }}
                        >
                            {!isAuthenticated
                                ? `Vui lòng đăng nhập để tiếp tục ${featureAccess ? 'sử dụng tính năng' : 'xem nội dung'}`
                                : 'Vui lòng xác nhận để tiếp tục'}
                        </Text>
                    </View>

                    {isAuthenticated && !featureAccess && (
                        <View
                            style={[
                                styles.agreementSection,
                                {
                                    backgroundColor: 'rgba(70, 211, 105, 0.1)', // Success color with opacity
                                    borderWidth: 1,
                                    borderColor: theme['color-success-500'],
                                },
                            ]}
                        >
                            <CheckBox
                                checked={agreeTerms}
                                onChange={(nextChecked) => setAgreeTerms(nextChecked)}
                                status="success"
                                style={styles.checkbox}
                            >
                                <Text
                                    category="s1"
                                    style={{
                                        fontWeight: 'bold',
                                        color: theme['color-success-700'],
                                    }}
                                >
                                    Tôi xác nhận và đồng ý rằng:
                                </Text>
                            </CheckBox>

                            <View style={styles.agreementReasons}>
                                {getAgreementReasons().map((item, index) => (
                                    <View key={index} style={styles.agreementItem}>
                                        {item}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>

                <Divider
                    style={{
                        marginTop: 16,
                        marginBottom: 16,
                        backgroundColor: theme['border-basic-color-3'],
                    }}
                />

                <View style={styles.actions}>
                    <Button
                        appearance="outline"
                        onPress={handleBackPress}
                        style={[
                            styles.button,
                            { borderColor: theme['border-basic-color-5'] },
                            styles.buttonHighlight,
                        ]}
                        size="medium"
                        status="basic"
                        activeOpacity={0.7}
                    >
                        Quay lại
                    </Button>
                    {!isAuthenticated ? (
                        <Button
                            onPress={handleLogin}
                            accessoryLeft={LoginIcon}
                            style={[styles.button, styles.buttonHighlight]}
                            size="medium"
                            status="primary"
                            activeOpacity={0.7}
                        >
                            Đăng nhập ngay
                        </Button>
                    ) : (
                        <Button
                            onPress={onAccept}
                            disabled={!featureAccess && !agreeTerms}
                            style={styles.button}
                            size="medium"
                            status="success"
                        >
                            {featureAccess ? 'Tiếp tục' : 'Tiếp tục xem phim'}
                        </Button>
                    )}
                </View>
            </Card>
        </Modal>
    );
};

// Helper functions
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

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    backdrop: {
        backgroundColor: 'rgba(20, 20, 20, 0.85)', // Match background-basic-color-1 with opacity
    },
    card: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        marginVertical: 20,
    },
    scrollView: {
        maxHeight: '80%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTags: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        gap: 8,
    },
    title: {
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    alert: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    alertContent: {
        paddingLeft: 4,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    descriptionText: {
        marginBottom: 8,
    },
    infoSection: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    agreementSection: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
    },
    reasonList: {
        marginTop: 8,
    },
    reasonItem: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
        marginRight: 10,
    },
    reasonTextContainer: {
        flex: 1,
    },
    reasonText: {
        lineHeight: 20,
    },
    agreementReasons: {
        marginTop: 12,
    },
    agreementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    buttonHighlight: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    checkbox: {
        marginBottom: 12,
    },
});
