import { Col, Form, FormProps, Row } from 'antd';

import { ActorType } from '~api/app/actors';
import { CategoryType } from '~api/app/categories';

import { BasicInfoTab } from './tabs/basic-info-tab';
import { ClassificationTab } from './tabs/classification-tab';
import { ServerEpisodeTab } from './tabs/server-episode-tab';
import { MediaTab } from './tabs/media-tab';
import { AdditionalInfoTab } from './tabs/additional-info-tab';
import { ExternalIdsTab } from './tabs/external-ids-tab';
import { MovieType } from '~api/app/movies/movie.type';
import { RegionType } from '~api/app/regions/region.type';
import { DirectorType } from '~api/app/directors/director.type';

type MovieFormProps = {
    formProps: FormProps<unknown>;
    actors?: ActorType[];
    categories?: CategoryType[];
    countries?: RegionType[];
    directors?: DirectorType[];
    isEditMode?: boolean;
    onFinish?: (values: MovieType) => void;
};

export const MovieForm: React.FC<MovieFormProps> = ({
    formProps,
    actors,
    categories,
    countries,
    directors,
    isEditMode = false,
    onFinish,
}) => {
    return (
        <Form {...formProps} layout="vertical" onFinish={onFinish ? onFinish : undefined}>
            <Row gutter={16}>
                <Col span={16}>
                    <BasicInfoTab />
                    <ClassificationTab
                        formProps={formProps}
                        defaultActors={actors}
                        defaultCategories={categories}
                        defaultCountries={countries}
                        defaultDirectors={directors}
                    />
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
