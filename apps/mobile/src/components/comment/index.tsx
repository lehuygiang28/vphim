import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {
    Avatar,
    Button,
    Card,
    Input,
    Text,
    useTheme,
    Layout,
    Spinner,
} from '@ui-kitten/components';
import { Send, User } from 'lucide-react-native';
import { useCreate, useInfiniteList } from '@refinedev/core';

import type { CommentType } from '~api/app/comments/comment.type';

import { COMMENT_LIST_QUERY, CREATE_COMMENT_MUTATION } from '~fe/queries/comment';

import { CommentItem } from './comment-item';
import authStore from '~mb/stores/authStore';

interface MovieCommentsProps {
    movieId: string;
}

export function MovieComments({ movieId }: MovieCommentsProps) {
    const { session, isLoading: sessionLoading } = authStore();

    const router = useRouter();
    const theme = useTheme();
    const [commentInput, setCommentInput] = useState('');

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfiniteList<CommentType>({
            dataProviderName: 'graphql',
            resource: 'comments',
            meta: {
                gqlQuery: COMMENT_LIST_QUERY,
                operation: 'movieComments',
            },
            filters: [
                {
                    field: 'movieId',
                    operator: 'eq',
                    value: movieId,
                },
            ],
            pagination: {
                pageSize: 10,
            },
        });

    const { mutate: createComment, isLoading: createLoading } = useCreate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: CREATE_COMMENT_MUTATION,
            operation: 'createComment',
        },
    });

    const allComments = useMemo(() => {
        return data?.pages.flatMap((page) => page.data) || [];
    }, [data]);

    const sortedComments = useMemo(() => {
        return [...allComments].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }, [allComments]);

    const handleCreateComment = useCallback(() => {
        if (!commentInput.trim() || createLoading) {
            return;
        }

        createComment(
            {
                resource: 'comments',
                values: {
                    movieId: movieId,
                    content: commentInput,
                },
            },
            {
                onSuccess: () => {
                    setCommentInput('');
                    refetch();
                },
            },
        );
    }, [createComment, movieId, commentInput, createLoading, refetch]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderComment = useCallback(
        ({ item }: { item: CommentType }) => (
            <CommentItem
                comment={item}
                isLoggedIn={!!session?.user}
                currentUserId={session?.user?._id?.toString()}
                refetch={refetch}
                user={session?.user}
                nestingLevel={item.nestingLevel}
            />
        ),
        [session, refetch],
    );

    const keyExtractor = useCallback(
        (item: CommentType) => `${item?._id?.toString()}_${new Date(item?.updatedAt)?.getTime()}`,
        [],
    );

    const renderFooter = useCallback(
        () => (
            <>
                {isFetchingNextPage && (
                    <View style={styles.loadingMoreContainer}>
                        <Spinner size="small" />
                        <Text style={styles.loadingMoreText}>Đang tải thêm bình luận...</Text>
                    </View>
                )}
                {hasNextPage && !isFetchingNextPage && (
                    <Button appearance="ghost" onPress={handleLoadMore}>
                        Xem thêm bình luận
                    </Button>
                )}
            </>
        ),
        [isFetchingNextPage, hasNextPage, handleLoadMore],
    );

    if (isLoading || (!session && sessionLoading)) {
        return (
            <Layout style={styles.loadingContainer} level="2">
                <Spinner size="large" />
            </Layout>
        );
    }

    return (
        <Layout style={styles.container} level="2">
            <FlatList
                data={sortedComments}
                renderItem={renderComment}
                keyExtractor={keyExtractor}
                ListHeaderComponent={
                    <>
                        <Text category="h6" style={styles.title}>
                            Bình luận ({data?.pages[0]?.total || 0})
                        </Text>

                        <Card style={styles.commentInputCard}>
                            {!session?.user ? (
                                <View>
                                    <Text style={styles.loginMessage}>
                                        Đăng nhập để bình luận về bộ phim này.
                                    </Text>
                                    <Button onPress={() => router.push('/auth')}>Đăng nhập</Button>
                                </View>
                            ) : (
                                <View style={styles.inputContainer}>
                                    <Avatar
                                        size="small"
                                        source={{ uri: session.user.avatar?.url }}
                                        ImageComponent={() => (
                                            <View style={styles.avatarIconContainer}>
                                                <User size={24} color={theme['color-basic-600']} />
                                            </View>
                                        )}
                                    />
                                    <Input
                                        style={styles.input}
                                        textStyle={styles.inputText}
                                        placeholder="Viết bình luận..."
                                        value={commentInput}
                                        onChangeText={setCommentInput}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        onPress={handleCreateComment}
                                        disabled={!commentInput.trim() || createLoading}
                                        style={[
                                            styles.sendButton,
                                            (!commentInput.trim() || createLoading) &&
                                                styles.sendButtonDisabled,
                                        ]}
                                    >
                                        <Send
                                            size={20}
                                            color={
                                                !commentInput.trim() || createLoading
                                                    ? theme['color-basic-600']
                                                    : theme['color-primary-500']
                                            }
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Card>
                    </>
                }
                ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>Chưa có bình luận nào!</Text>
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.commentList}
            />
        </Layout>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    container: {
        flex: 1,
        marginBottom: 40,
    },
    commentContainer: {
        marginHorizontal: 16,
    },
    title: {
        marginVertical: 16,
        marginHorizontal: 16,
    },
    commentInputCard: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },
    inputText: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendButton: {
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    loadingMoreText: {
        marginLeft: 8,
    },
    commentList: {
        flexGrow: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 16,
    },
    avatarIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginMessage: {
        marginBottom: 16,
    },
});
