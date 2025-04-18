import gql from 'graphql-tag';

export const GET_WATCH_HISTORY_ADMIN = gql`
    query GetWatchHistoryAdmin($input: GetWatchHistoryInputAdmin) {
        getWatchHistoryAdmin(input: $input) {
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
                serverIndex
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

export const GET_MOVIE_WATCH_HISTORY_ADMIN = gql`
    query GetMovieWatchHistoryAdmin($input: GetMovieWatchHistoryInputAdmin) {
        getMovieWatchHistoryAdmin(input: $input) {
            _id
            movieId {
                _id
                name
                slug
            }
            episodeName
            episodeSlug
            serverName
            serverIndex
            progress {
                currentTime
                duration
                completed
            }
            lastWatched
        }
    }
`;
