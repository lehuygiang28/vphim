import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, List, Space, Typography, Input, Card, Divider } from 'antd';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';
import { useCreate, useInfiniteList, useGetIdentity } from '@refinedev/core';

import type { CommentType } from 'apps/api/src/app/comments/comment.type';
import type { UserType } from 'apps/api/src/app/users/user.type';

import { isNullOrUndefined } from '@/libs/utils/common';
import { COMMENT_LIST_QUERY, CREATE_COMMENT_MUTATION } from '@/queries/comment';
import { Comment } from '@/components/comments';

const { Title, Link } = Typography;
const { TextArea } = Input;

interface MovieCommentsProps {
    movieId: string;
}

export const MovieComments: React.FC<MovieCommentsProps> = ({ movieId }) => {
    const { data: user } = useGetIdentity<UserType>();
    const [commentInput, setCommentInput] = useState('');
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteList<CommentType>({
        resource: 'comments',
        dataProviderName: 'graphql',
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
        }
    });

    const { mutate: createComment, isLoading: createLoading } = useCreate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: CREATE_COMMENT_MUTATION,
            operation: 'createComment',
        },
        successNotification: () => ({
            message: 'Thành công',
            description: 'Bình luận đã được gửi',
            type: 'success',
        }),
        errorNotification: () => ({
            message: 'Lỗi hệ thống',
            description: 'Không thể gửi bình luận. Vui lòng thử lại sau!',
            type: 'error',
        }),
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
                    // Force a fresh fetch to get the latest comments
                    refetch();
                    if (commentInputRef.current) {
                        commentInputRef.current.blur();
                    }
                },
            },
        );
    }, [createComment, movieId, commentInput, refetch]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <Card
            style={{
                background: 'rgb(25, 25, 25)',
                borderRadius: '1rem',
                marginBottom: '2rem',
            }}
        >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={5} style={{ color: 'white' }}>
                    Bình luận ({data?.pages[0]?.total || 0})
                </Title>

                {/* Leave a comment section */}
                <Card
                    style={{
                        background: 'rgb(40, 40, 40)',
                        borderRadius: '0.5rem',
                    }}
                >
                    {user ? (
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <TextArea
                                ref={commentInputRef}
                                rows={4}
                                placeholder="Để lại bình luận..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                maxLength={1000}
                                showCount
                                onKeyDown={(e) => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                        handleCreateComment();
                                    }
                                }}
                            />
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
                    ) : (
                        <>
                            <style>
                                {`
                                    .comment_require_login {
                                        color: peru !important;
                                    }
                                `}
                            </style>
                            <Typography.Text>
                                Vui lòng
                                <Link
                                    className="comment_require_login"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push(`/dang-nhap?to=${window?.location?.href}`);
                                    }}
                                    href={`/dang-nhap?to=${window?.location?.href}`}
                                >
                                    {' '}
                                    đăng nhập{' '}
                                </Link>
                                để bình luận
                            </Typography.Text>
                        </>
                    )}
                </Card>
                <Divider />

                {/* List of comments */}
                <List
                    loading={isLoading}
                    itemLayout="vertical"
                    dataSource={sortedComments}
                    locale={{
                        emptyText: 'Chưa có bình luận nào!',
                    }}
                    renderItem={(comment) => (
                        <List.Item
                            style={{
                                background: 'rgb(40, 40, 40)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1rem',
                            }}
                        >
                            <Comment
                                comment={comment}
                                isLoggedIn={!!user}
                                currentUserId={user?._id?.toString() || ''}
                                refetch={refetch}
                            />
                        </List.Item>
                    )}
                />

                {/* Load more trigger */}
                {(hasNextPage) && (
                    <div
                        style={{
                            textAlign: 'center',
                            marginTop: 16,
                            padding: '8px 0',
                        }}
                    >
                        <Button onClick={handleLoadMore} disabled={isFetchingNextPage}>
                            {isFetchingNextPage ? (
                                <LoadingOutlined />
                            ) : (
                                'Tải thêm bình luận'
                            )}
                        </Button>
                    </div>
                )}
            </Space>
        </Card>
    );
};

export default MovieComments;
