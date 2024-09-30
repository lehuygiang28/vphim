import gql from 'graphql-tag';

export const MNT_REGIONS_LIST_QUERY = gql`
    query GetRegions($input: GetRegionsInput!) {
        regions(input: $input) {
            data {
                _id
                name
                slug
                updatedAt
            }
            total
        }
    }
`;

export const MNT_REGION_CREATE = gql`
    mutation CreateRegion($input: CreateRegionInput!) {
        createRegion(input: $input) {
            _id
        }
    }
`;

export const MNT_REGION_QUERY = gql`
    query GetRegion($input: GetRegionInput!) {
        region(input: $input) {
            _id
            name
            slug
        }
    }
`;

export const MNT_REGION_UPDATE = gql`
    mutation UpdateRegion($input: UpdateRegionInput!) {
        updateRegion(input: $input) {
            _id
        }
    }
`;

export const MNT_REGION_DELETE = gql`
    mutation HardDeleteRegion($input: DeleteRegionInput!) {
        deleteRegion(input: $input)
    }
`;
