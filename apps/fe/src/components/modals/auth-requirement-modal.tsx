import React, { ReactNode, useState } from 'react';
import { Modal, Typography, Alert, Checkbox, Button, Divider } from 'antd';
import {
    WarningOutlined,
    LockOutlined,
    LoginOutlined,
    RobotOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

export enum ModalType {
    AGE_VERIFICATION = 'age_verification',
    FEATURE_ACCESS = 'feature_access',
}

export interface AuthRequirementModalProps {
    visible: boolean;
    onClose: () => void;
    onAccept?: () => void;
    isLoggedIn: boolean;
    type: ModalType;
    title?: ReactNode;
    icon?: ReactNode;
    primaryMessage?: string;
    primaryDescription?: ReactNode;
    secondaryMessage?: string;
    secondaryDescription?: ReactNode;
    primaryAlertType?: 'success' | 'info' | 'warning' | 'error';
    secondaryAlertType?: 'success' | 'info' | 'warning' | 'error';
    reasonList?: ReactNode[];
    checkboxText?: string;
    acceptButtonText?: string;
    requiresAgreement?: boolean;
    loginRedirectUrl?: string;
    agreementList?: ReactNode[];
    maskClosable?: boolean;
}

export const AuthRequirementModal: React.FC<AuthRequirementModalProps> = ({
    visible,
    onClose,
    onAccept,
    isLoggedIn,
    type,
    title,
    icon,
    primaryMessage,
    primaryDescription,
    secondaryMessage,
    secondaryDescription,
    primaryAlertType = 'warning',
    secondaryAlertType = 'error',
    reasonList = [],
    checkboxText,
    acceptButtonText = 'Tiếp tục',
    requiresAgreement = false,
    loginRedirectUrl,
    agreementList = [],
    maskClosable = false,
}) => {
    const [agreeTerms, setAgreeTerms] = useState(false);
    const router = useRouter();
    const needsLogin = !isLoggedIn;

    // Determine icon based on type if not provided
    const renderIcon = () => {
        if (icon) return icon;

        switch (type) {
            case ModalType.AGE_VERIFICATION:
                return (
                    <WarningOutlined
                        style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}
                    />
                );
            case ModalType.FEATURE_ACCESS:
                return (
                    <RobotOutlined
                        style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}
                    />
                );
            default:
                return (
                    <ExclamationCircleOutlined
                        style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }}
                    />
                );
        }
    };

    // Handle login redirection
    const handleLogin = () => {
        const redirectUrl = loginRedirectUrl || window.location.href;
        router.push(`/dang-nhap?to=${encodeURIComponent(redirectUrl)}`);
    };

    // Auto-accept for logged in users if no agreement needed
    if (!needsLogin && !requiresAgreement && onAccept) {
        onAccept();
        return null;
    }

    return (
        <Modal
            open={visible}
            centered
            closable={false}
            footer={null}
            width={480}
            maskClosable={maskClosable}
            bodyStyle={{ padding: '24px', borderRadius: '12px' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {renderIcon()}
                <Title level={4} style={{ margin: '0 0 8px' }}>
                    {title ||
                        (type === ModalType.AGE_VERIFICATION
                            ? 'Xác nhận độ tuổi'
                            : 'Tính năng yêu cầu đăng nhập')}
                </Title>
            </div>

            <Alert
                message={primaryMessage || 'Yêu cầu xác thực'}
                description={primaryDescription}
                type={primaryAlertType}
                showIcon
                style={{ marginBottom: '20px' }}
            />

            {needsLogin && (
                <Alert
                    message={secondaryMessage || 'Đăng nhập bắt buộc'}
                    description={
                        secondaryDescription ||
                        'Tính năng này yêu cầu xác thực người dùng trước khi sử dụng.'
                    }
                    type={secondaryAlertType}
                    showIcon
                    icon={<LockOutlined />}
                    style={{ marginBottom: '20px' }}
                />
            )}

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
                        Tại sao cần {needsLogin ? 'đăng nhập' : 'xác nhận'}?
                    </Text>
                </Paragraph>

                <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0' }}>
                    {reasonList.length > 0 ? (
                        reasonList.map((reason, index) => <li key={index}>{reason}</li>)
                    ) : (
                        <>
                            {type === ModalType.FEATURE_ACCESS ? (
                                <>
                                    <li>
                                        Đây là tính năng cao cấp dành cho người dùng đã đăng nhập.
                                    </li>
                                    <li>
                                        Giúp chúng tôi cá nhân hóa kết quả phù hợp với sở thích của
                                        bạn.
                                    </li>
                                    <li>
                                        Cho phép bạn lưu trữ và theo dõi lịch sử sử dụng tính năng.
                                    </li>
                                    <li>
                                        Bảo vệ hệ thống khỏi việc sử dụng quá mức và lạm dụng tài
                                        nguyên.
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>Nội dung này yêu cầu xác thực độ tuổi trước khi xem.</li>
                                    <li>Đảm bảo nội dung phù hợp với độ tuổi người xem.</li>
                                    <li>Bảo vệ trẻ em khỏi nội dung không phù hợp.</li>
                                </>
                            )}
                        </>
                    )}
                </ul>

                <Paragraph style={{ textAlign: 'center' }}>
                    <Text>
                        {needsLogin
                            ? `Vui lòng đăng nhập để ${
                                  type === ModalType.AGE_VERIFICATION
                                      ? 'tiếp tục xem nội dung'
                                      : 'sử dụng tính năng này'
                              }`
                            : 'Vui lòng xác nhận để tiếp tục'}
                    </Text>
                </Paragraph>
            </div>

            {!needsLogin && requiresAgreement && (
                <>
                    <Checkbox
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                    >
                        <Text>{checkboxText || 'Tôi xác nhận và đồng ý với điều khoản trên'}</Text>
                    </Checkbox>

                    {agreementList.length > 0 && (
                        <div style={{ marginLeft: '24px', marginTop: '8px', marginBottom: '16px' }}>
                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {agreementList.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
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
                    <Button
                        type="primary"
                        disabled={requiresAgreement && !agreeTerms}
                        onClick={onAccept}
                    >
                        {acceptButtonText}
                    </Button>
                )}
            </div>
        </Modal>
    );
};
