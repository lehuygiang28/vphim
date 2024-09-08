import gql from 'graphql-tag';

export const REGIONS_LIST_QUERY = gql`
    query GetRegions($input: GetRegionsInput!) {
        regions(input: $input) {
            data {
                name
                slug
            }
            total
        }
    }
`;
