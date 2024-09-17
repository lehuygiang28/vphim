import gql from 'graphql-tag';

export const MNT_MOVIE_LIST_QUERY = gql`
    query GetMovies($input: GetMoviesInput!) {
        movies(input: $input) {
            data {
                _id
                name
                originName
                thumbUrl
                episodeCurrent
                slug
                year
                quality
                type
                status
                view
                imdb {
                    id
                }
                tmdb {
                    id
                    type
                }
                updatedAt
            }
            total
        }
    }
`;

export const GET_FULL_MOVIE_DETAIL_QUERY = gql`
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
                _id
                name
                slug
            }
            directors {
                _id
                name
                slug
            }
            actors {
                _id
                name
                slug
            }
            categories {
                _id
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
            imdb {
                id
            }
            tmdb {
                id
                type
            }
        }
    }
`;