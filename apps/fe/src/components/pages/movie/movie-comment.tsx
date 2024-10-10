import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button, List, Space, Typography, Input, Card, Divider } from 'antd';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';
import { useCreate, useInfiniteList } from '@refinedev/core';
import { useDebouncedCallback } from 'use-debounce';

import { COMMENT_LIST_QUERY, CREATE_COMMENT_MUTATION } from '@/queries/comment';
import { Comment } from '@/components/comments';
import { CommentType } from 'apps/api/src/app/comments/comment.type';
import { isNullOrUndefined } from 'apps/api/src/libs/utils/common';

const { Title } = Typography;
const { TextArea } = Input;

interface MovieCommentsProps {
    movieId: string;
}

export const MovieComments: React.FC<MovieCommentsProps> = ({ movieId }) => {
    const [commentInput, setCommentInput] = useState('');
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

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
                pageSize: 6,
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
        if (isNullOrUndefined(commentInput) || commentInput.trim() === '') {
            return;
        }

        createComment(
            {
                values: {
                    movieId: movieId,
                    content: commentInput,
                },
            },
            {
                onSuccess: () => {
                    setCommentInput('');
                    refetch();
                    if (commentInputRef.current) {
                        commentInputRef.current.blur();
                    }
                },
            },
        );
    }, [createComment, movieId, commentInput, refetch]);

    const debouncedSetCommentInput = useDebouncedCallback(
        (value: string) => setCommentInput(value),
        300,
    );

    const handleLoadMore = useCallback(() => {
        if (hasNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, fetchNextPage]);

    return (
        <Card
            style={{
                background: 'rgb(30, 30, 30)',
                borderRadius: '1rem',
                marginBottom: '2rem',
            }}
        >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={5} style={{ color: 'white' }}>
                    Comments ({data?.pages[0]?.total || 0})
                </Title>

                {/* Leave a comment section */}
                <Card
                    style={{
                        background: 'rgb(40, 40, 40)',
                        borderRadius: '0.5rem',
                    }}
                >
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <TextArea
                            ref={commentInputRef}
                            rows={4}
                            placeholder="Để lại bình luận..."
                            defaultValue={commentInput}
                            onChange={(e) => debouncedSetCommentInput(e.target.value)}
                            onPressEnter={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                    handleCreateComment();
                                }
                            }}
                        />
                        <Space>
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleCreateComment}
                                loading={createLoading}
                                disabled={!commentInput.trim()}
                            >
                                Bình luận
                            </Button>
                        </Space>
                    </Space>
                </Card>
                <Divider />

                {/* List of comments */}
                <List
                    loading={isLoading}
                    itemLayout="vertical"
                    dataSource={sortedComments}
                    renderItem={(comment) => (
                        <List.Item
                            style={{
                                background: 'rgb(40, 40, 40)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1rem',
                            }}
                        >
                            <Comment comment={comment} />
                        </List.Item>
                    )}
                    loadMore={
                        hasNextPage && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Button onClick={handleLoadMore} disabled={isFetchingNextPage}>
                                    {isFetchingNextPage ? (
                                        <LoadingOutlined />
                                    ) : (
                                        'Tải thêm bình luận'
                                    )}
                                </Button>
                            </div>
                        )
                    }
                />
            </Space>
        </Card>
    );
};

export default MovieComments;
