import gql from 'graphql-tag';

export const GET_ACTOR_LIST_QUERY = gql`
    query GetActors($input: GetActorsInput!) {
        actors(input: $input) {
            data {
                _id
                name
                slug
            }
            total
        }
    }
`;
