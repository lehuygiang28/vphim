import gql from 'graphql-tag';

export const MNT_MOVIE_LIST_QUERY = gql`
    query GetMovies($input: GetMoviesAdminInput!) {
        moviesForAdmin(input: $input) {
            data {
                _id
                name
                originName
                posterUrl
                episodeCurrent
                slug
                year
                quality
                contentRating
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
            notify
            originName
            quality
            contentRating
            showtimes
            slug
            status
            subDocquyen
            posterUrl
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
                posterUrl
            }
            actors {
                _id
                name
                slug
                posterUrl
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
                originSrc
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

export const CHECK_MOVIE_EXIST_SLUG = gql`
    query GetMovie($input: GetMovieInput!) {
        movie(input: $input) {
            _id
            slug
        }
    }
`;

export const MUTATION_UPDATE_MOVIE = gql`
    mutation UpdateMovie($input: UpdateMovieInput!) {
        updateMovie(input: $input) {
            _id
        }
    }
`;

export const MUTATION_HARD_DELETE_MOVIE = gql`
    mutation HardDeleteMovie($input: MutateHardDeleteMovieInput!) {
        mutateHardDeleteMovie(input: $input)
    }
`;

export const CREATE_MOVIE = gql`
    mutation CreateMovie($input: CreateMovieInput!) {
        createMovie(input: $input) {
            _id
            slug
        }
    }
`;
