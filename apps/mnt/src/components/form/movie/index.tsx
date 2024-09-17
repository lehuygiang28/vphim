import { Col, Form, FormProps, Row } from 'antd';

import { ActorType } from '~api/app/actors';
import { CategoryType } from '~api/app/categories';

import { BasicInfoTab } from './tabs/basic-info-tab';
import { ClassificationTab } from './tabs/classification-tab';
import { ServerEpisodeTab } from './tabs/server-episode-tab';
import { MediaTab } from './tabs/media-tab';
import { AdditionalInfoTab } from './tabs/additional-info-tab';
import { ExternalIdsTab } from './tabs/external-ids-tab';

type MovieFormProps = {
    formProps: FormProps<unknown>;
    actors: ActorType[];
    categories: CategoryType[];
    isEditMode?: boolean;
};

export const MovieForm: React.FC<MovieFormProps> = ({
    formProps,
    actors,
    categories,
    isEditMode = false,
}) => {
    return (
        <Form {...formProps} layout="vertical">
            <Row gutter={16}>
                <Col span={16}>
                    <BasicInfoTab />
                    <ClassificationTab defaultActors={actors} defaultCategories={categories} />
                    <ServerEpisodeTab formProps={formProps} />
                </Col>
                <Col span={8}>
                    <MediaTab formProps={formProps} />
                    <AdditionalInfoTab />
                    <ExternalIdsTab />
                </Col>
            </Row>
        </Form>
    );
};
