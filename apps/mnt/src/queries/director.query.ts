import gql from 'graphql-tag';

export const GET_DIRECTOR_LIST_QUERY = gql`
    query GetDirectors($input: GetDirectorsInput!) {
        directors(input: $input) {
            data {
                _id
                name
                originalName
                slug
                updatedAt
                posterUrl
            }
            total
        }
    }
`;

export const MNT_DIRECTOR_CREATE = gql`
    mutation CreateDirector($input: CreateDirectorInput!) {
        createDirector(input: $input) {
            _id
        }
    }
`;

export const MNT_DIRECTOR_QUERY = gql`
    query GetDirector($input: GetDirectorInput!) {
        director(input: $input) {
            _id
            name
            originalName
            slug
            updatedAt
            posterUrl
        }
    }
`;

export const MNT_DIRECTOR_UPDATE = gql`
    mutation UpdateDirector($input: UpdateDirectorInput!) {
        updateDirector(input: $input) {
            _id
        }
    }
`;

export const MNT_DIRECTOR_DELETE = gql`
    mutation HardDeleteDirector($input: DeleteDirectorInput!) {
        deleteDirector(input: $input)
    }
`;
