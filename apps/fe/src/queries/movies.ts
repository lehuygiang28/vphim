import gql from 'graphql-tag';

export const MOVIES_LIST_QUERY = gql`
    query GetMovies($input: GetMoviesInput!) {
        movies(input: $input) {
            data {
                _id
                name
                originName
                posterUrl
                thumbUrl
                episodeCurrent
                slug
                year
                quality
                content
            }
            total
        }
    }
`;
