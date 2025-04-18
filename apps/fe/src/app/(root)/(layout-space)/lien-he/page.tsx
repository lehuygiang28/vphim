'use client';

import React, { useState } from 'react';
import { Typography, Input, Button, Row, Col, Card, Form, message, Divider, Tooltip } from 'antd';
import { Mail, Copy, Facebook, Twitter, Send } from 'lucide-react';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ContactInfoItem {
    label: string;
    value: string;
    icon: React.ReactNode;
    action: () => void;
    copyAction: () => void;
}

export default function ContactPage() {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            messageApi.success('Đã sao chép vào bộ nhớ tạm');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            messageApi.error('Không thể sao chép vào bộ nhớ tạm');
        }
    };

    const contactInfo: ContactInfoItem[] = [
        {
            label: 'Email',
            value: 'contact@vephim.online',
            icon: <Mail size={20} style={{ color: 'var(--vphim-color-primary)' }} />,
            action: () => window.open('mailto:contact@vephim.online'),
            copyAction: () => copyToClipboard('contact@vephim.online'),
        },
    ];

    const handleSubmit = (values: any) => {
        setIsSubmitting(true);

        // Simulate sending a message
        setTimeout(() => {
            setIsSubmitting(false);
            messageApi.success('Tin nhắn đã được gửi thành công');
            form.resetFields();
        }, 1500);
    };

    return (
        <div style={{ padding: '32px 16px' }}>
            {contextHolder}

            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2}>Liên hệ với chúng tôi</Title>
                    <Paragraph style={{
                        color: 'var(--vphim-color-text-secondary)',
                        maxWidth: 768,
                        margin: '0 auto'
                    }}>
                        Nếu bạn có thắc mắc, góp ý hoặc cần hỗ trợ, vui lòng liên hệ theo thông tin
                        bên dưới hoặc gửi tin nhắn qua mẫu liên hệ.
                    </Paragraph>
                </div>

                <Row gutter={[32, 32]}>
                    <Col xs={24} md={10}>
                        <Card style={{ height: '100%' }}>
                            <Title level={4} style={{ marginBottom: 24 }}>
                                Thông tin liên hệ
                            </Title>

                            {contactInfo.map((item, index) => (
                                <div key={index} style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        {item.icon}
                                        <Text strong style={{ marginLeft: 8 }}>
                                            {item.label}:
                                        </Text>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 28 }}>
                                        <Text
                                            style={{
                                                cursor: 'pointer',
                                                flex: 1
                                            }}
                                            onClick={item.action}
                                        >
                                            {item.value}
                                        </Text>
                                        <Tooltip title="Sao chép">
                                            <Button
                                                type="text"
                                                icon={<Copy size={16} />}
                                                onClick={item.copyAction}
                                                style={{ marginLeft: 8 }}
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}

                            <Divider />

                            <Title level={5} style={{ marginBottom: 16 }}>
                                Theo dõi chúng tôi
                            </Title>
                            <div style={{ display: 'flex', marginTop: 16 }}>
                                <Link href="https://facebook.com/" target="_blank">
                                    <Button
                                        shape="circle"
                                        size="large"
                                        style={{
                                            marginRight: 12,
                                            backgroundColor: '#1877F2',
                                            color: 'white'
                                        }}
                                        icon={<Facebook size={20} />}
                                    />
                                </Link>
                                <Link href="https://twitter.com/" target="_blank">
                                    <Button
                                        shape="circle"
                                        size="large"
                                        style={{
                                            backgroundColor: '#1DA1F2',
                                            color: 'white'
                                        }}
                                        icon={<Twitter size={20} />}
                                    />
                                </Link>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={14}>
                        <Card title="Gửi tin nhắn">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                requiredMark={false}
                            >
                                <Form.Item
                                    name="name"
                                    label="Họ tên"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên của bạn' }]}
                                >
                                    <Input placeholder="Nhập họ tên của bạn" />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email của bạn' },
                                        { type: 'email', message: 'Email không hợp lệ' }
                                    ]}
                                >
                                    <Input placeholder="Nhập email của bạn" />
                                </Form.Item>

                                <Form.Item
                                    name="message"
                                    label="Tin nhắn"
                                    rules={[{ required: true, message: 'Vui lòng nhập nội dung tin nhắn' }]}
                                >
                                    <TextArea
                                        placeholder="Nhập nội dung tin nhắn"
                                        rows={5}
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={isSubmitting}
                                        icon={<Send size={16} style={{ marginRight: 8 }} />}
                                        style={{ marginTop: 8 }}
                                    >
                                        {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                </Row>

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Text style={{ color: 'var(--vphim-color-text-secondary)' }}>
                        © {new Date().getFullYear()} VePhim. Mọi quyền được bảo lưu.
                    </Text>
                </div>
            </div>
        </div>
    );
}
