import gql from 'graphql-tag';

export const SAVE_WATCH_HISTORY = gql`
    mutation SaveWatchHistory($input: SaveWatchHistoryInput!) {
        saveWatchHistory(input: $input) {
            _id
            movieId {
                _id
                name
                slug
                thumbUrl
            }
            episodeName
            episodeSlug
            serverName
            serverSlug
            progress {
                currentTime
                duration
                completed
            }
            lastWatched
        }
    }
`;

export const GET_WATCH_HISTORY = gql`
    query GetWatchHistory($input: GetWatchHistoryInput) {
        getWatchHistory(input: $input) {
            total
            data {
                _id
                movieId {
                    _id
                    name
                    slug
                    thumbUrl
                    originName
                    type
                    quality
                    episodeCurrent
                    episodeTotal
                }
                episodeName
                episodeSlug
                serverName
                serverSlug
                progress {
                    currentTime
                    duration
                    completed
                }
                lastWatched
            }
        }
    }
`;

export const GET_MOVIE_WATCH_HISTORY = gql`
    query GetMovieWatchHistory($input: GetMovieWatchHistoryInput!) {
        getMovieWatchHistory(input: $input) {
            _id
            movieId {
                _id
                name
                slug
            }
            episodeName
            episodeSlug
            serverName
            serverSlug
            progress {
                currentTime
                duration
                completed
            }
            lastWatched
        }
    }
`;

export const DELETE_WATCH_HISTORY = gql`
    mutation DeleteWatchHistory($input: DeleteWatchHistoryInput!) {
        deleteWatchHistory(input: $input)
    }
`;

export const CLEAR_ALL_WATCH_HISTORY = gql`
    mutation ClearAllWatchHistory {
        clearAllWatchHistory
    }
`;
