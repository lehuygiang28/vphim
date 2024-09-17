import { Card, Col, Form, Input, Row, Select, Switch } from 'antd';

const { Option } = Select;

export function AdditionalInfoTab() {
    return (
        <Card title="Additional Information" style={{ marginTop: 16 }} bordered={false}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Type" name="type">
                        <Select>
                            <Option value="movie">Movie</Option>
                            <Option value="series">Series</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Quality" name="quality">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Language" name="lang">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Time" name="time">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="Showtimes" name="showtimes">
                <Input />
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Cinema Release" name="cinemaRelease" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Is Copyright" name="isCopyright" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}
