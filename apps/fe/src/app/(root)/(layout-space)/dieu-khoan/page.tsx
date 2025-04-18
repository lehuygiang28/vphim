'use client';

import React from 'react';
import { Typography, Divider, Card, Row, Col } from 'antd';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function PrivacyPolicyPage() {
    const sections = [
        {
            title: 'Tuyên bố mục đích giáo dục',
            content:
                'Dự án phần mềm này ("VePhim") được cung cấp CHỈ DÀNH CHO MỤC ĐÍCH GIÁO DỤC VÀ TRÌNH DIỄN. VePhim được thiết kế để trình diễn kỹ thuật phát triển ứng dụng web và di động tiên tiến.',
            icon: <Shield size={24} style={{ color: 'var(--vphim-color-primary)' }} />,
        },
        {
            title: 'Hạn chế sử dụng',
            content:
                'Khi truy cập, tải xuống, cài đặt hoặc sử dụng VePhim, bạn xác nhận và đồng ý rằng:\n\n1. VePhim không lưu trữ, tải lên hoặc phân phối bất kỳ nội dung phim, tệp phương tiện hoặc tài liệu có bản quyền nào trên máy chủ của mình.\n\n2. VePhim chỉ hoạt động như một ứng dụng thu thập nội dung từ các nguồn công khai, tổng hợp danh mục và công nghệ khám phá.\n\n3. Tất cả nội dung phương tiện có thể truy cập thông qua VePhim đều được lấy từ các nguồn bên thứ ba và vẫn được lưu trữ trên các nguồn đó.',
            icon: <AlertTriangle size={24} style={{ color: 'var(--vphim-color-warning)' }} />,
        },
        {
            title: 'Trách nhiệm của người dùng',
            content:
                'Người dùng VePhim hoàn toàn chịu trách nhiệm về:\n\n1. Đảm bảo việc sử dụng VePhim tuân thủ tất cả các luật và quy định hiện hành liên quan đến bản quyền, quyền sở hữu trí tuệ, quyền riêng tư dữ liệu và truy cập nội dung.\n\n2. Xác minh họ có quyền hợp pháp để truy cập bất kỳ nội dung nào họ xem thông qua VePhim.\n\n3. Sử dụng các khái niệm công nghệ được trình diễn trong VePhim chỉ theo cách hợp pháp và đạo đức.',
            icon: <AlertTriangle size={24} style={{ color: 'var(--vphim-color-warning)' }} />,
        },
        {
            title: 'Giới hạn trách nhiệm',
            content:
                'PHẦN MỀM VEPHIM ĐƯỢC CUNG CẤP "NGUYÊN TRẠNG", KHÔNG CÓ BẢO ĐẢM DƯỚI BẤT KỲ HÌNH THỨC NÀO, RÕ RÀNG HAY NGỤ Ý.\n\nTÁC GIẢ VÀ NGƯỜI ĐÓNG GÓP CỦA VEPHIM ĐẶC BIỆT TỪ CHỐI MỌI TRÁCH NHIỆM VỀ BẤT KỲ HÀNH VI SỬ DỤNG SAI MỤC ĐÍCH NÀO CỦA PHẦN MỀM HOẶC BẤT KỲ HOẠT ĐỘNG BẤT HỢP PHÁP NÀO ĐƯỢC TIẾN HÀNH VỚI PHẦN MỀM.',
            icon: <AlertTriangle size={24} style={{ color: 'var(--vphim-color-warning)' }} />,
        },
        {
            title: 'Sở hữu trí tuệ',
            content:
                'VePhim tôn trọng quyền sở hữu trí tuệ và mong đợi người dùng của mình cũng làm như vậy. Nếu bạn tin rằng tác phẩm có bản quyền của bạn đã được sử dụng theo cách cấu thành vi phạm bản quyền, vui lòng liên hệ với người bảo trì dự án ngay lập tức.',
            icon: <Shield size={24} style={{ color: 'var(--vphim-color-primary)' }} />,
        },
        {
            title: 'Chấp nhận điều khoản',
            content:
                'Bằng cách sử dụng VePhim, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi tuyên bố miễn trừ trách nhiệm này. Nếu bạn không đồng ý với bất kỳ phần nào của tuyên bố miễn trừ trách nhiệm này, bạn không được sử dụng VePhim.',
            icon: <Shield size={24} style={{ color: 'var(--vphim-color-primary)' }} />,
        },
    ];

    return (
        <div style={{ padding: '32px 16px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <Shield size={48} style={{ color: 'var(--vphim-color-primary)' }} />
                    </div>
                    <Title level={2}>Chính sách sử dụng</Title>
                    <Paragraph
                        style={{
                            color: 'var(--vphim-color-text-secondary)',
                            maxWidth: 768,
                            margin: '0 auto',
                        }}
                    >
                        Vui lòng đọc kỹ chính sách này trước khi sử dụng VePhim
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]}>
                    {sections.map((section, index) => (
                        <Col xs={24} key={index}>
                            <Card style={{ boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <div style={{ marginRight: 16, marginTop: 4 }}>
                                        {section.icon}
                                    </div>
                                    <div>
                                        <Title level={4} style={{ marginBottom: 16 }}>
                                            {section.title}
                                        </Title>
                                        <Paragraph>
                                            {section.content.split('\n\n').map((paragraph, i) => (
                                                <div key={i}>
                                                    {paragraph}
                                                    {i <
                                                        section.content.split('\n\n').length -
                                                            1 && (
                                                        <>
                                                            <br />
                                                            <br />
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </Paragraph>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Divider />

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Text
                        style={{
                            color: 'var(--vphim-color-text-secondary)',
                            display: 'block',
                        }}
                    >
                        Cập nhật lần cuối: Tháng 3 năm 2025
                    </Text>
                    <Text
                        style={{
                            color: 'var(--vphim-color-text-secondary)',
                            display: 'block',
                            margin: '8px 0 16px',
                        }}
                    >
                        Để biết thêm thông tin, vui lòng liên hệ:{' '}
                        <Link
                            href="mailto:contact@vephim.online"
                            style={{ color: 'var(--vphim-color-primary)' }}
                        >
                            contact@vephim.online
                        </Link>
                    </Text>
                    <Link
                        href="mailto:contact@vephim.online"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        <ExternalLink size={14} style={{ marginRight: 4 }} /> Liên hệ
                    </Link>
                </div>
            </div>
        </div>
    );
}
