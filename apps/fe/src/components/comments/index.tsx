import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Avatar,
    Button,
    List,
    Typography,
    Input,
    notification,
    Popconfirm,
    Space,
    Dropdown,
    Spin,
    theme,
} from 'antd';
import {
    CommentOutlined,
    UserOutlined,
    SendOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
    LoadingOutlined,
    LikeOutlined,
    DownOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { useCreate, useDelete, useUpdate, useInfiniteList } from '@refinedev/core';
import styles from './styles/index.module.css';

import type { CommentType } from 'apps/api/src/app/comments/comment.type';

import {
    CREATE_COMMENT_MUTATION,
    DELETE_COMMENT_MUTATION,
    UPDATE_COMMENT_MUTATION,
    COMMENT_REPLIES_QUERY,
} from '@/queries/comment';
import { relativeDate } from '@/libs/utils/relative-date';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CommentProps {
    comment: CommentType;
    isLoggedIn: boolean;
    currentUserId: string | undefined;
    refetch?: () => void;
    isNested?: boolean;
    nestingLevel: number;
    maxNestingLevel: number;
}

export const Comment: React.FC<CommentProps> = ({
    comment,
    isLoggedIn,
    currentUserId,
    refetch,
    isNested = false,
    nestingLevel,
    maxNestingLevel,
}) => {
    const { token } = theme.useToken();
    const [replyVisible, setReplyVisible] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const commentId = useMemo(() => comment._id?.toString(), [comment._id]);

    // Calculate indentation for nested comments
    const leftIndent = useMemo(
        () => (nestingLevel > 0 ? `${Math.min(nestingLevel * 16, 64)}px` : '0px'),
        [nestingLevel],
    );

    // Avatar class based on nesting level
    const avatarClass = useMemo(() => {
        if (nestingLevel >= 3) return styles.avatarSmall;
        if (nestingLevel >= 1) return styles.avatarMedium;
        return styles.avatarLarge;
    }, [nestingLevel]);

    const {
        data: repliesData,
        isLoading: isLoadingReplies,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchReplies,
    } = useInfiniteList<CommentType>({
        resource: 'comments',
        dataProviderName: 'graphql',
        meta: {
            gqlQuery: COMMENT_REPLIES_QUERY,
            operation: 'commentReplies',
        },
        filters: [
            {
                field: 'parentCommentId',
                operator: 'eq',
                value: commentId,
            },
            {
                field: 'movieId',
                operator: 'eq',
                value: comment.movieId,
            },
            {
                field: 'includeNestedReplies',
                operator: 'eq',
                value: nestingLevel >= 3, // Use includeNestedReplies for deeply nested comments
            },
        ],
        pagination: {
            pageSize: 5,
        },
        queryOptions: {
            enabled: showReplies,
        },
    });

    const allReplies = useMemo(() => {
        return repliesData?.pages.flatMap((page) => page.data) || [];
    }, [repliesData]);

    const validReplies = useMemo(() => {
        return allReplies.filter(
            (reply) => reply && reply._id && reply.user && reply.user._id && reply.content,
        );
    }, [allReplies]);

    const handleLoadMoreReplies = useCallback(() => {
        if (hasNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, fetchNextPage]);

    const { mutate: createComment, isLoading: isCreating } = useCreate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: CREATE_COMMENT_MUTATION,
            operation: 'createComment',
        },
        errorNotification: () => ({
            message: 'Lỗi hệ thống',
            description: 'Không thể gửi bình luận. Vui lòng thử lại sau!',
            type: 'error',
        }),
        successNotification: () => ({
            message: 'Thành công',
            description: 'Bình luận đã được gửi',
            type: 'success',
        }),
    });

    const { mutate: editComment, isLoading: isUpdating } = useUpdate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: UPDATE_COMMENT_MUTATION,
            operation: 'updateComment',
        },
        errorNotification: () => ({
            message: 'Lỗi hệ thống',
            description: 'Không thể cập nhật bình luận. Vui lòng thử lại sau!',
            type: 'error',
        }),
        successNotification: () => ({
            message: 'Thành công',
            description: 'Bình luận đã được cập nhật',
            type: 'success',
        }),
    });

    const { mutate: mutateDelete } = useDelete();
    const handleDeleteComment = () => {
        mutateDelete(
            {
                dataProviderName: 'graphql',
                resource: 'comments',
                meta: {
                    gqlMutation: DELETE_COMMENT_MUTATION,
                    operation: 'deleteComment',
                },
                id: comment._id?.toString(),
                values: {
                    _id: comment._id?.toString(),
                },
                invalidates: ['list'],
                errorNotification: () => ({
                    message: 'Lỗi hệ thống',
                    description: 'Không thể xóa bình luận. Vui lòng thử lại sau!',
                    type: 'error',
                }),
                successNotification: () => ({
                    message: 'Thành công',
                    description: 'Bình luận đã được xóa',
                    type: 'success',
                }),
            },
            {
                onSuccess: () => {
                    refetch?.();
                    if (showReplies) {
                        refetchReplies();
                    }
                },
            },
        );
    };

    useEffect(() => {
        if (replyVisible && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [replyVisible]);

    useEffect(() => {
        if (isEditing && editTextAreaRef.current) {
            editTextAreaRef.current.focus();
            editTextAreaRef.current.selectionStart = editedContent.length;
        }
    }, [isEditing]);

    const handleCreateComment = () => {
        if (!isLoggedIn) {
            notification.error({
                type: 'error',
                message: 'Lỗi',
                description: 'Vui lòng đăng nhập để bình luận',
                key: 'comment_require_login',
            });
            return;
        }

        const trimmedComment = newComment.trim();
        if (!trimmedComment) return;

        if (!comment.movieId) {
            notification.error({
                type: 'error',
                message: 'Lỗi',
                description: 'Không thể xác định phim. Vui lòng thử lại sau!',
                key: 'movie_id_missing',
            });
            return;
        }

        createComment(
            {
                values: {
                    movieId: comment.movieId?.toString(),
                    parentCommentId: comment._id?.toString(),
                    content: trimmedComment,
                },
            },
            {
                onSuccess: () => {
                    setNewComment('');
                    setReplyVisible(false);
                    refetch?.();

                    // Only fetch replies if this comment's replies are currently shown
                    if (showReplies) {
                        refetchReplies();
                    } else {
                        // If replies weren't shown, show them now
                        setShowReplies(true);
                    }
                },
            },
        );
    };

    const handleEditComment = () => {
        const trimmedContent = editedContent.trim();
        if (!trimmedContent || trimmedContent === comment.content) return;

        editComment(
            {
                id: comment._id?.toString(),
                values: {
                    _id: comment._id,
                    content: trimmedContent,
                },
                invalidates: ['list'],
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    refetch?.();
                    if (showReplies) {
                        refetchReplies();
                    }
                },
            },
        );
    };

    const isCommentOwner = currentUserId === comment.user?._id?.toString();
    const hasBeenEdited = !!comment.editedAt;
    const hasReplies = comment?.replyCount > 0;

    // Display different visual treatment for deep nested comments
    const isDeepNested = nestingLevel >= 3;

    // Render replies with proper nesting
    const renderReplies = useCallback(() => {
        if (!showReplies) return null;

        if (isLoadingReplies) {
            return (
                <div className={styles.loadingContainer}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </div>
            );
        }

        if (validReplies.length === 0) {
            return <div className={styles.noReplies}>Chưa có phản hồi nào</div>;
        }

        return (
            <div className={styles.nestedCommentsContainer}>
                {/* Connecting line */}
                <div className={styles.connectingLine} />

                <List
                    dataSource={validReplies}
                    renderItem={(reply) => (
                        <List.Item
                            style={{
                                padding: '0.5rem 0',
                                borderBottom: 'none',
                            }}
                        >
                            <Comment
                                comment={reply}
                                isLoggedIn={isLoggedIn}
                                currentUserId={currentUserId}
                                isNested={true}
                                refetch={() => {
                                    refetch?.();
                                    refetchReplies();
                                }}
                                nestingLevel={nestingLevel + 1}
                                maxNestingLevel={maxNestingLevel}
                            />
                        </List.Item>
                    )}
                />
                {hasNextPage && (
                    <div style={{ textAlign: 'center', marginTop: 8, paddingBottom: 8 }}>
                        <Button
                            onClick={handleLoadMoreReplies}
                            disabled={isFetchingNextPage}
                            type="link"
                            className={styles.loadMoreButton}
                            size="small"
                        >
                            {isFetchingNextPage ? (
                                <LoadingOutlined style={{ fontSize: 14 }} />
                            ) : (
                                'Xem thêm phản hồi'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    }, [
        showReplies,
        isLoadingReplies,
        validReplies,
        hasNextPage,
        isFetchingNextPage,
        handleLoadMoreReplies,
        isLoggedIn,
        currentUserId,
        refetch,
        refetchReplies,
        nestingLevel,
        maxNestingLevel,
    ]);

    // Apply style for comment container
    const commentWrapperStyle = useMemo(
        () => ({
            position: 'relative' as const,
            width: '100%',
            marginBottom: nestingLevel === 0 ? '8px' : '0px',
        }),
        [nestingLevel],
    );

    // Facebook-style comment bubble style
    const commentBubbleStyle = useMemo(
        () => ({
            backgroundColor: isDeepNested
                ? `rgba(${token.colorPrimaryBg.split('rgb(')[1]?.split(')')[0] || '0,0,0'}, 0.05)`
                : token.colorBgElevated,
            borderRadius: '18px',
            padding: '8px 12px',
            boxShadow: isDeepNested ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: 'fit-content',
            maxWidth: '100%',
        }),
        [isDeepNested, token.colorPrimaryBg, token.colorBgElevated],
    );

    return (
        <div style={commentWrapperStyle}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                {/* Avatar with potential badge for deep nesting */}
                <div className={styles.avatarContainer}>
                    <Avatar
                        src={
                            comment.user?.avatar?.url &&
                            getOptimizedImageUrl(comment.user.avatar.url, {
                                width: nestingLevel >= 3 ? 28 : nestingLevel >= 1 ? 32 : 40,
                                height: nestingLevel >= 3 ? 28 : nestingLevel >= 1 ? 32 : 40,
                                quality: 70,
                            })
                        }
                        alt={comment.user?.fullName || 'Người dùng'}
                        icon={<UserOutlined />}
                        className={avatarClass}
                    />
                </div>

                {/* Comment content area */}
                <div className={styles.commentWrapper}>
                    {/* Comment bubble */}
                    <div className={styles.commentContent}>
                        {/* Username and comment content */}
                        <div className={styles.commentInner}>
                            <Text strong className={styles.commentAuthor}>
                                {comment.user?.fullName || 'Người dùng'}
                            </Text>

                            {isEditing ? (
                                <div className={styles.editContainer}>
                                    <TextArea
                                        ref={editTextAreaRef}
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        autoSize={{ minRows: 2, maxRows: 6 }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleEditComment();
                                            }
                                        }}
                                        className={styles.editInput}
                                    />
                                    <Space className={styles.editActions}>
                                        <Button
                                            type="primary"
                                            onClick={handleEditComment}
                                            loading={isUpdating}
                                            disabled={editedContent.trim() === comment.content}
                                            size="small"
                                        >
                                            Lưu
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditedContent(comment.content);
                                            }}
                                            disabled={isUpdating}
                                            size="small"
                                        >
                                            Hủy
                                        </Button>
                                    </Space>
                                </div>
                            ) : (
                                <Paragraph
                                    className={styles.commentBody}
                                    ellipsis={{ rows: 5, expandable: true, symbol: 'Xem thêm' }}
                                >
                                    {comment.content}
                                </Paragraph>
                            )}
                        </div>
                    </div>

                    {/* Comment metadata and action buttons */}
                    <div className={styles.commentMeta}>
                        {/* Time and edit indicator */}
                        <Text className={styles.commentDate}>
                            {comment.createdAt ? relativeDate(new Date(comment.createdAt)) : ''}
                            {hasBeenEdited && comment.editedAt && (
                                <span className={styles.editedIndicator}>(đã chỉnh sửa)</span>
                            )}
                        </Text>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Like button (placeholder for future functionality) */}
                            <Button type="text" size="small" className={styles.commentActionButton}>
                                Thích
                            </Button>

                            {/* Reply button */}
                            {!isEditing && isLoggedIn && (
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => setReplyVisible(!replyVisible)}
                                    className={styles.commentActionButton}
                                >
                                    {replyVisible ? 'Hủy trả lời' : 'Trả lời'}
                                </Button>
                            )}

                            {/* Edit/Delete dropdown for owner */}
                            {isCommentOwner && !isEditing && (
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: 'edit',
                                                icon: <EditOutlined />,
                                                label: 'Chỉnh sửa',
                                                onClick: () => setIsEditing(true),
                                            },
                                            {
                                                key: 'delete',
                                                icon: <DeleteOutlined />,
                                                label: (
                                                    <Popconfirm
                                                        title="Xóa bình luận này?"
                                                        okText="Xóa"
                                                        cancelText="Hủy"
                                                        onConfirm={handleDeleteComment}
                                                    >
                                                        <Text type="danger">Xóa</Text>
                                                    </Popconfirm>
                                                ),
                                            },
                                        ],
                                    }}
                                    trigger={['click']}
                                >
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<MoreOutlined style={{ fontSize: '0.9rem' }} />}
                                        style={{
                                            padding: 0,
                                            height: 'auto',
                                            color: token.colorTextSecondary,
                                        }}
                                    />
                                </Dropdown>
                            )}
                        </div>
                    </div>

                    {/* Show replies button */}
                    {hasReplies && (
                        <div className={styles.replyToggleContainer}>
                            <Button
                                type="text"
                                size="small"
                                onClick={() => setShowReplies(!showReplies)}
                                className={styles.replyToggleButton}
                                icon={
                                    <span
                                        className={`${styles.arrow} ${
                                            showReplies ? styles.arrowRotated : ''
                                        }`}
                                    >
                                        {showReplies ? <DownOutlined /> : <RightOutlined />}
                                    </span>
                                }
                            >
                                {showReplies ? 'Ẩn phản hồi' : `${comment.replyCount} phản hồi`}
                            </Button>
                        </div>
                    )}

                    {/* Reply input area */}
                    {replyVisible && (
                        <div className={styles.replyContainer}>
                            <div className={styles.replyForm}>
                                <Avatar
                                    size={32}
                                    icon={<UserOutlined />}
                                    className={styles.replyAvatar}
                                />
                                <div className={styles.replyInputWrapper}>
                                    <TextArea
                                        ref={textAreaRef}
                                        rows={2}
                                        placeholder="Viết phản hồi..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        maxLength={1000}
                                        className={styles.replyInput}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleCreateComment();
                                            }
                                        }}
                                    />
                                    <div className={styles.replyActions}>
                                        <Button
                                            type="primary"
                                            icon={<SendOutlined />}
                                            loading={isCreating}
                                            disabled={!newComment.trim()}
                                            onClick={handleCreateComment}
                                            className={styles.replySubmitButton}
                                        >
                                            Gửi
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Replies container */}
                    {renderReplies()}
                </div>
            </div>
        </div>
    );
};
