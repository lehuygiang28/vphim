import gql from 'graphql-tag';

export const GET_MOVIE_QUERY = gql`
    query GetMovie($input: GetMovieInput!) {
        movie(input: $input) {
            _id
            name
            cinemaRelease
            content
            createdAt
            episodeCurrent
            episodeTotal
            isCopyright
            lang
            lastSyncModified
            notify
            originName
            posterUrl
            quality
            showtimes
            slug
            status
            subDocquyen
            thumbUrl
            time
            trailerUrl
            type
            updatedAt
            view
            year
            countries {
                name
                slug
            }
            directors {
                name
                slug
            }
            actors {
                name
                slug
            }
            categories {
                name
                slug
            }
            episode {
                serverData {
                    slug
                    name
                    filename
                    linkM3u8
                    linkEmbed
                }
                serverName
            }
        }
    }
`;

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
