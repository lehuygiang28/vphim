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

export const MOVIES_LIST_FOR_SWIPER_QUERY = gql`
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
                time
                content
                view
                imdb {
                    id
                }
                tmdb {
                    id
                    type
                }
            }
            total
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
                time
                lang
            }
            total
        }
    }
`;

export const MOVIES_LIST_QUERY_FOR_ISR = gql`
    query GetMovies($input: GetMoviesInput!) {
        movies(input: $input) {
            data {
                slug
            }
            total
        }
    }
`;

export const GET_MOVE_RATING_QUERY = gql`
    query GetRating($input: GetMovieInput!) {
        getRating(input: $input) {
            tmdb {
                id
                voteCount
                voteAverage
            }
        }
    }
`;
