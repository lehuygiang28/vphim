import gql from 'graphql-tag';

export const GET_DIRECTOR_LIST_QUERY = gql`
    query GetDirectors($input: GetDirectorsInput!) {
        directors(input: $input) {
            data {
                _id
                name
                slug
            }
            total
        }
    }
`;
