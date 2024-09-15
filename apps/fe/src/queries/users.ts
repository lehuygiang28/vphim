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

export const GET_OWN_FOLLOWING_MOVIES = gql`
    query GetMe {
        getMe {
            followMovies {
                slug
            }
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

export const FOLLOW_MOVIE_MUTATION = gql`
    mutation FollowMovie($input: MutationFollowMovieInput!) {
        followMovie(input: $input) {
            _id
            followMovies {
                slug
            }
        }
    }
`;

export const UNFOLLOW_MOVIE_MUTATION = gql`
    mutation UnfollowMovie($input: MutationUnfollowMovieInput!) {
        unfollowMovie(input: $input) {
            _id
            followMovies {
                slug
            }
        }
    }
`;
