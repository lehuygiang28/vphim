import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Avatar,
    Button,
    List,
    Typography,
    Input,
    Row,
    Col,
    notification,
    Popconfirm,
    Space,
    Dropdown,
    Spin,
} from 'antd';
import {
    CommentOutlined,
    UserOutlined,
    SendOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { useCreate, useDelete, useUpdate, useInfiniteList } from '@refinedev/core';

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
}

export const Comment: React.FC<CommentProps> = ({
    comment,
    isLoggedIn,
    currentUserId,
    refetch,
    isNested = false,
}) => {
    const [replyVisible, setReplyVisible] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const commentId = useMemo(() => comment._id?.toString(), [comment._id]);

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
        ],
        pagination: {
            pageSize: 5,
        },
        queryOptions: {
            enabled: showReplies && !isNested
        },
    });

    const allReplies = useMemo(() => {
        return repliesData?.pages.flatMap((page) => page.data) || [];
    }, [repliesData]);

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
                    if (showReplies && !isNested) {
                        refetchReplies();
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

    const isCommentOwner = currentUserId === comment.user._id?.toString();
    const hasBeenEdited = !!comment.editedAt;
    const hasReplies = comment?.replyCount > 0;

    return (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Row gutter={[12, 12]} align="top" wrap={false}>
                <Col flex="none" style={{ top: '0.5rem' }}>
                    <Avatar
                        src={
                            comment.user?.avatar?.url &&
                            getOptimizedImageUrl(comment.user.avatar.url, {
                                width: isNested ? 25 : 40,
                                height: isNested ? 25 : 40,
                                quality: 70,
                            })
                        }
                        alt={comment.user.fullName}
                        icon={<UserOutlined />}
                        style={isNested ? { width: 25, height: 25 } : { width: 40, height: 40 }}
                    />
                </Col>

                <Col flex="auto" style={{ minWidth: 0 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <Space size={8} style={{ flexWrap: 'wrap', rowGap: 0 }}>
                                <Text strong ellipsis style={{ maxWidth: 200 }}>
                                    {comment.user.fullName}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {relativeDate(new Date(comment.createdAt))}
                                    {hasBeenEdited && (
                                        <span style={{ marginLeft: 8, fontStyle: 'italic' }}>
                                            (đã chỉnh sửa)
                                        </span>
                                    )}
                                </Text>
                            </Space>

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
                                        icon={<MoreOutlined />}
                                        style={{ marginLeft: 'auto' }}
                                    />
                                </Dropdown>
                            )}
                        </div>

                        {isEditing ? (
                            <div style={{ position: 'relative' }}>
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
                                />
                                <Space style={{ marginTop: 8 }}>
                                    <Button
                                        type="primary"
                                        onClick={handleEditComment}
                                        loading={isUpdating}
                                        disabled={editedContent.trim() === comment.content}
                                    >
                                        Lưu
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedContent(comment.content);
                                        }}
                                        disabled={isUpdating}
                                    >
                                        Hủy
                                    </Button>
                                </Space>
                            </div>
                        ) : (
                            <Paragraph
                                ellipsis={{ rows: 5, expandable: true, symbol: 'Xem thêm' }}
                                style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                            >
                                {comment.content}
                            </Paragraph>
                        )}

                        <Space size={12}>
                            {!isEditing && isLoggedIn && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<CommentOutlined />}
                                    onClick={() => setReplyVisible(!replyVisible)}
                                    style={{ paddingLeft: 0, height: 'auto' }}
                                >
                                    <Text strong>{replyVisible ? 'Hủy trả lời' : 'Trả lời'}</Text>
                                </Button>
                            )}
                            {!isNested && hasReplies && (
                                <Button
                                    type="text"
                                    size="small"
                                    onClick={() => setShowReplies(!showReplies)}
                                    style={{ paddingLeft: 0, height: 'auto' }}
                                >
                                    <Text strong>{showReplies ? 'Ẩn phản hồi' : `Xem ${comment.replyCount} phản hồi`}</Text>
                                </Button>
                            )}
                        </Space>
                    </Space>
                </Col>
            </Row>

            {replyVisible && (
                <div style={{ marginLeft: 30 }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <TextArea
                            ref={textAreaRef}
                            rows={3}
                            placeholder="Viết bình luận của bạn..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            maxLength={1000}
                            showCount
                            disabled={isCreating}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreateComment();
                                }
                            }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleCreateComment}
                                loading={isCreating}
                                disabled={!newComment.trim()}
                            >
                                Gửi
                            </Button>
                            <Button
                                onClick={() => {
                                    setReplyVisible(false);
                                    setNewComment('');
                                }}
                                disabled={isCreating}
                            >
                                Hủy
                            </Button>
                        </div>
                    </Space>
                </div>
            )}

            {!isNested && showReplies && (
                <div style={{ marginLeft: 30 }}>
                    <List
                        loading={isLoadingReplies}
                        dataSource={allReplies}
                        renderItem={(reply) => (
                            <List.Item
                                style={{
                                    padding: '1rem 0',
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
                                />
                            </List.Item>
                        )}
                    />
                    {hasNextPage && (
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Button onClick={handleLoadMoreReplies} disabled={isFetchingNextPage}>
                                {isFetchingNextPage ? (
                                    <LoadingOutlined />
                                ) : (
                                    'Xem thêm phản hồi'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Space>
    );
};
