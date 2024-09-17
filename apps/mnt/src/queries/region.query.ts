import gql from 'graphql-tag';

export const MNT_REGIONS_LIST_QUERY = gql`
    query GetRegions($input: GetRegionsInput!) {
        regions(input: $input) {
            data {
                _id
                name
                slug
            }
            total
        }
    }
`;
