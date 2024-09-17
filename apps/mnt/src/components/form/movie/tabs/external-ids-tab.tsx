import { Card, Form, Input, InputNumber, Select } from 'antd';

const { Option } = Select;

export function ExternalIdsTab() {
    return (
        <Card title="External IDs" style={{ marginTop: 16 }} bordered={false}>
            <Form.Item label="IMDB ID" name={['imdb', 'id']}>
                <Input />
            </Form.Item>
            <Form.Item label="TMDB ID" name={['tmdb', 'id']}>
                <Input />
            </Form.Item>
            <Form.Item label="TMDB Type" name={['tmdb', 'type']}>
                <Select>
                    <Option value="movie">Movie</Option>
                    <Option value="tv">TV</Option>
                </Select>
            </Form.Item>
            <Form.Item label="TMDB Season" name={['tmdb', 'season']}>
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Card>
    );
}
