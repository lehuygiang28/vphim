import { useCustom, useCustomMutation } from '@refinedev/core';
import { useState, useCallback } from 'react';
import { useIsAuthenticated } from '@refinedev/core';
import {
    SAVE_WATCH_HISTORY,
    GET_WATCH_HISTORY,
    GET_MOVIE_WATCH_HISTORY,
    DELETE_WATCH_HISTORY,
    CLEAR_ALL_WATCH_HISTORY,
} from '@/queries/watch-history';

type WatchProgressInput = {
    currentTime: number;
    duration: number;
    completed?: boolean;
};

type SaveWatchHistoryInput = {
    movieId: string;
    episodeName?: string;
    episodeSlug?: string;
    serverName: string;
    serverSlug: string;
    progress: WatchProgressInput;
};

interface WatchHistoryItem {
    _id: string;
    movieId: {
        _id: string;
        name: string;
        slug: string;
        thumbUrl: string;
        originName?: string;
        type?: string;
        quality?: string;
        episodeCurrent?: string;
        episodeTotal?: string;
    };
    episodeName: string;
    episodeSlug: string;
    serverName: string;
    serverSlug: string;
    progress: {
        currentTime: number;
        duration: number;
        completed: boolean;
    };
    lastWatched: string;
}

interface WatchHistoryResponse {
    data: WatchHistoryItem[];
    total: number;
}

export const useWatchHistory = () => {
    const { data: authData, isLoading: isAuthLoading } = useIsAuthenticated();
    const isAuthenticated = authData?.authenticated;
    const [isSaving, setIsSaving] = useState(false);

    // Get a list of watch history items
    const {
        data: historyData,
        isLoading,
        refetch,
    } = useCustom<WatchHistoryResponse>({
        url: 'graphql',
        method: 'post',
        meta: {
            gqlQuery: GET_WATCH_HISTORY,
            operation: 'getWatchHistory',
            variables: {
                input: {
                    limit: 10,
                    offset: 0,
                },
            },
        },
        queryOptions: {
            enabled: !isAuthLoading && !!isAuthenticated,
        },
    });

    // Save watch history
    const { mutateAsync: saveWatchHistoryAsync } = useCustomMutation();

    const saveHistory = useCallback(
        async (input: SaveWatchHistoryInput) => {
            if (!isAuthenticated || isSaving) {
                return;
            }

            try {
                setIsSaving(true);
                await saveWatchHistoryAsync({
                    url: 'graphql',
                    method: 'post',
                    values: {},
                    meta: {
                        gqlMutation: SAVE_WATCH_HISTORY,
                        variables: {
                            input,
                        },
                    },
                });
                await refetch();
            } catch (error) {
                console.error('Failed to save watch history:', error);
            } finally {
                setIsSaving(false);
            }
        },
        [isAuthenticated, isSaving, saveWatchHistoryAsync, refetch],
    );

    // Get watch history for a specific movie
    const { mutateAsync: getMovieHistoryAsync } = useCustomMutation();

    const getMovieHistory = useCallback(
        async (movieId: string) => {
            if (!isAuthenticated || !movieId) {
                return [];
            }

            try {
                const response = await getMovieHistoryAsync({
                    url: 'graphql',
                    method: 'post',
                    values: {},
                    meta: {
                        gqlQuery: GET_MOVIE_WATCH_HISTORY,
                        operation: 'getMovieWatchHistory',
                        variables: {
                            input: { movieId },
                        },
                    },
                    successNotification: false,
                    errorNotification: false,
                });

                if (response && typeof response === 'object' && 'data' in response) {
                    const result = response.data;
                    return result?.getMovieWatchHistory || [];
                }
                return [];
            } catch (error) {
                console.error('Failed to get movie watch history:', error);
                return [];
            }
        },
        [isAuthenticated, getMovieHistoryAsync],
    );

    // Delete watch history item
    const { mutateAsync: deleteHistoryAsync } = useCustomMutation();

    const deleteWatchHistory = useCallback(
        async (watchHistoryId: string) => {
            if (!isAuthenticated) {
                return false;
            }

            try {
                await deleteHistoryAsync({
                    url: 'graphql',
                    method: 'post',
                    values: {},
                    meta: {
                        gqlMutation: DELETE_WATCH_HISTORY,
                        variables: {
                            input: { watchHistoryId },
                        },
                    },
                    successNotification: {
                        type: 'success',
                        message: 'Lịch sử xem phim đã được xóa',
                    },
                    errorNotification: {
                        type: 'error',
                        message: 'Lỗi khi xóa lịch sử xem phim, vui lòng thử lại',
                    },
                });
                await refetch();
                return true;
            } catch (error) {
                console.error('Failed to delete watch history:', error);
                return false;
            }
        },
        [isAuthenticated, deleteHistoryAsync, refetch],
    );

    // Clear all watch history
    const { mutateAsync: clearAllHistoryAsync } = useCustomMutation();

    const clearAllWatchHistory = useCallback(async () => {
        if (!isAuthenticated) {
            return false;
        }

        try {
            await clearAllHistoryAsync({
                url: 'graphql',
                method: 'post',
                values: {},
                meta: {
                    gqlMutation: CLEAR_ALL_WATCH_HISTORY,
                },
                successNotification: {
                    message: 'Tất cả lịch sử xem phim đã được xóa',
                    type: 'success',
                },
                errorNotification: {
                    message: 'Lỗi khi xóa lịch sử xem phim, vui lòng thử lại',
                    type: 'error',
                },
            });
            await refetch();
            return true;
        } catch (error) {
            console.error('Failed to clear watch history:', error);
            return false;
        }
    }, [isAuthenticated, clearAllHistoryAsync, refetch]);

    const watchHistory = historyData?.data?.data || [];
    const totalHistoryItems = historyData?.data?.total || 0;

    return {
        watchHistory,
        totalHistoryItems,
        isLoading,
        isAuthenticated,
        saveHistory,
        getMovieHistory,
        deleteWatchHistory,
        clearAllWatchHistory,
    };
};

export default useWatchHistory;
