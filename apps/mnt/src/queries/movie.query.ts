import gql from 'graphql-tag';

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
