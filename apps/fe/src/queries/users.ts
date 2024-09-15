import gql from 'graphql-tag';

export const GET_ME_QUERY = gql`
    query GetMe {
        getMe {
            _id
            email
            fullName
            avatar {
                url
            }
            role
        }
    }
`;

export const MUTATION_ME_QUERY = gql`
    mutation MutationMe($input: MutationMeInput!) {
        mutationMe(input: $input) {
            _id
            email
            fullName
            avatar {
                url
            }
        }
    }
`;
