import gql from 'graphql-tag';

export const GET_ACTOR_LIST_QUERY = gql`
    query GetActors($input: GetActorsInput!) {
        actors(input: $input) {
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

export const MNT_ACTOR_CREATE = gql`
    mutation CreateActor($input: CreateActorInput!) {
        createActor(input: $input) {
            _id
        }
    }
`;

export const MNT_ACTOR_QUERY = gql`
    query GetActor($input: GetActorInput!) {
        actor(input: $input) {
            _id
            name
            originalName
            slug
            updatedAt
            posterUrl
        }
    }
`;

export const MNT_ACTOR_UPDATE = gql`
    mutation UpdateActor($input: UpdateActorInput!) {
        updateActor(input: $input) {
            _id
        }
    }
`;

export const MNT_ACTOR_DELETE = gql`
    mutation HardDeleteActor($input: DeleteActorInput!) {
        deleteActor(input: $input)
    }
`;
