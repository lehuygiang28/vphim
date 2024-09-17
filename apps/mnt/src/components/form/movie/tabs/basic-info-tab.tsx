import { Card, Col, Form, Input, InputNumber, Row } from 'antd';

export function BasicInfoTab() {
    return (
        <Card title="Basic Information" bordered={false}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Please input the movie name!',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Original Name" name="originName">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Slug" name="slug">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Year" name="year">
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="Content" name="content">
                <Input.TextArea rows={15} />
            </Form.Item>
        </Card>
    );
}
