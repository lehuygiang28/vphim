import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Button,
    Space,
    Typography,
    Input,
    Card,
    Divider,
    theme,
    Spin,
    ConfigProvider,
    Avatar,
} from 'antd';
import { SendOutlined, LoadingOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import { useCreate, useInfiniteList, useGetIdentity } from '@refinedev/core';
import styles from './styles/movie-comment.module.css';

import type { CommentType } from 'apps/api/src/app/comments/comment.type';
import type { UserType } from 'apps/api/src/app/users/user.type';

import { isNullOrUndefined } from '@/libs/utils/common';
import { COMMENT_LIST_QUERY, CREATE_COMMENT_MUTATION } from '@/queries/comment';
import { Comment } from '@/components/comments';

const { Title, Link, Text } = Typography;
const { TextArea } = Input;

interface MovieCommentsProps {
    movieId: string;
    maxNestingLevel?: number;
}

export const MovieComments: React.FC<MovieCommentsProps> = ({ movieId, maxNestingLevel = 5 }) => {
    const { token } = theme.useToken();
    const { data: user } = useGetIdentity<UserType>();
    const [commentInput, setCommentInput] = useState('');
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
        useInfiniteList<CommentType>({
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
            },
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

    const commentCount = data?.pages[0]?.total || 0;

    return (
        <ConfigProvider
            theme={{
                components: {
                    Button: {
                        borderRadius: 8,
                    },
                    Input: {
                        borderRadius: 8,
                    },
                    Card: {
                        borderRadius: 16,
                    },
                },
            }}
        >
            <Card className={styles.commentsWrapper} bodyStyle={{ padding: '1.5rem' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Comment header section */}
                    <div className={styles.commentsHeader}>
                        <Title level={5} className={styles.commentsTitle}>
                            Bình luận
                            <Text className={styles.commentCount}> ({commentCount})</Text>
                        </Title>
                    </div>

                    {/* Leave a comment section */}
                    <div className={styles.inputContainer}>
                        <div className={styles.commentForm}>
                            <Avatar
                                size={40}
                                src={user?.avatar?.url}
                                icon={<UserOutlined />}
                                className={styles.avatarContainer}
                            />
                            <div className={styles.inputWrapper}>
                                {user ? (
                                    <>
                                        <TextArea
                                            ref={commentInputRef}
                                            rows={3}
                                            placeholder="Để lại bình luận..."
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            maxLength={1000}
                                            showCount
                                            className={`${styles.commentTextArea} custom-textarea-count`}
                                            onKeyDown={(e) => {
                                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                    handleCreateComment();
                                                }
                                            }}
                                        />
                                        <style jsx global>{`
                                            .custom-textarea-count .ant-input-data-count {
                                                bottom: -24px !important;
                                                margin-left: 5px;
                                                font-size: 12px;
                                                color: rgba(255, 255, 255, 0.45);
                                            }
                                        `}</style>
                                        <div className={styles.commentActions}>
                                            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                                Ctrl+Enter để gửi nhanh
                                            </Text>
                                            <Button
                                                type="primary"
                                                icon={<SendOutlined />}
                                                onClick={handleCreateComment}
                                                loading={createLoading}
                                                disabled={!commentInput.trim()}
                                                className={styles.commentButton}
                                            >
                                                Bình luận
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.loginPrompt}>
                                            <Text>
                                                Vui lòng
                                                <Link
                                                    className={styles.loginLink}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        router.push(
                                                            `/dang-nhap?to=${window?.location?.href}`,
                                                        );
                                                    }}
                                                    href={`/dang-nhap?to=${window?.location?.href}`}
                                                >
                                                    {' '}
                                                    đăng nhập{' '}
                                                </Link>
                                                để bình luận
                                            </Text>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Divider
                        style={{ margin: '0.5rem 0 1.5rem', borderColor: 'rgba(255,255,255,0.1)' }}
                    />

                    {/* List of comments */}
                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <Spin
                                indicator={
                                    <LoadingOutlined
                                        style={{ fontSize: 32, color: token.colorPrimary }}
                                        spin
                                    />
                                }
                                tip="Đang tải bình luận..."
                            />
                        </div>
                    ) : (
                        <>
                            <div className={styles.commentsListWrapper}>
                                {sortedComments.length === 0 ? (
                                    <div className={styles.noCommentsContainer}>
                                        <MessageOutlined className={styles.noCommentsIcon} />
                                        <Text className={styles.noCommentsText}>
                                            Chưa có bình luận nào!
                                        </Text>
                                    </div>
                                ) : (
                                    sortedComments.map((comment) => (
                                        <div
                                            key={comment._id?.toString()}
                                            className={styles.commentContainer}
                                        >
                                            <Comment
                                                comment={comment}
                                                isLoggedIn={!!user}
                                                currentUserId={user?._id?.toString() || ''}
                                                refetch={refetch}
                                                nestingLevel={0}
                                                maxNestingLevel={maxNestingLevel}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Load more trigger */}
                            {hasNextPage && (
                                <div className={styles.loadMoreContainer}>
                                    <Button onClick={handleLoadMore} disabled={isFetchingNextPage}>
                                        {isFetchingNextPage ? (
                                            <LoadingOutlined />
                                        ) : (
                                            'Tải thêm bình luận'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Space>
            </Card>
        </ConfigProvider>
    );
};

export default MovieComments;
