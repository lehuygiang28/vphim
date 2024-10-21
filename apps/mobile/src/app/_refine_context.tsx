import React, { PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { DataProvider, Refine } from '@refinedev/core';

import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';

import { axiosInstance } from '~mb/libs/axios';

export default function RefineContextProvider({ children }: PropsWithChildren) {
    return (
        <Refine
            dataProvider={{
                default: restfulDataProvider(axiosInstance) as DataProvider,
                graphql: graphqlDataProvider(axiosInstance, {
                    publicApiUrl: process.env.EXPO_PUBLIC_BASE_API_URL,
                }) as DataProvider,
            }}
            resources={[
                {
                    name: 'movie',
                    list: '/movie',
                },
            ]}
            options={{
                reactQuery: {
                    devtoolConfig: Platform.OS === 'web' ? undefined : false,
                },
                disableTelemetry: true,
                useNewQueryKeys: true,
                projectId: 'NJcdqz-Mcj2uR-iCRTib',
            }}
        >
            {children}
        </Refine>
    );
}
