import React, { useState, useRef, useEffect } from 'react';
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
} from 'antd';
import {
    CommentOutlined,
    UserOutlined,
    SendOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import { useCreate, useDelete, useUpdate } from '@refinedev/core';

import type { CommentType } from 'apps/api/src/app/comments/comment.type';

import { isNullOrUndefined } from '@/libs/utils/common';
import {
    CREATE_COMMENT_MUTATION,
    DELETE_COMMENT_MUTATION,
    UPDATE_COMMENT_MUTATION,
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
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const { mutate: createComment, isLoading: isCreating } = useCreate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: CREATE_COMMENT_MUTATION,
            operation: 'createComment',
        },
        errorNotification: false,
        successNotification: false,
    });

    const { mutate: editComment } = useUpdate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: UPDATE_COMMENT_MUTATION,
            operation: 'updateComment',
        },
        errorNotification: false,
        successNotification: false,
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
                errorNotification: false,
                successNotification: false,
                invalidates: ['list'],
            },
            {
                onSuccess: () => {
                    refetch();
                },
            },
        );
    };

    useEffect(() => {
        if (replyVisible && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [replyVisible]);

    const handleCreateComment = () => {
        if (!isLoggedIn) {
            notification.error({
                type: 'error',
                message: 'Vui lòng đăng nhập để bình luận',
                key: 'comment_require_login',
            });
            return;
        }

        if (isNullOrUndefined(newComment) || newComment.trim() === '') {
            return;
        }

        createComment(
            {
                values: {
                    movieId: comment.movie?.toString(),
                    parentCommentId: comment._id?.toString(),
                    content: newComment,
                },
                invalidates: ['list'],
            },
            {
                onSuccess: () => {
                    setNewComment('');
                    setReplyVisible(false);
                    refetch();
                },
            },
        );
    };

    const handleEditComment = () => {
        if (isNullOrUndefined(editedContent) || editedContent.trim() === '') {
            return;
        }

        editComment(
            {
                id: comment._id?.toString(),
                values: {
                    _id: comment._id,
                    content: editedContent,
                },
                invalidates: ['list'],
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    refetch();
                },
            },
        );
    };

    const isCommentOwner = currentUserId === comment.user._id?.toString();

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={[16, 16]} align="top">
                <Col flex="2rem">
                    <Avatar
                        src={
                            comment.user?.avatar?.url &&
                            getOptimizedImageUrl(comment.user?.avatar?.url, {
                                width: 32,
                                height: 32,
                                quality: 50,
                            })
                        }
                        alt={comment.user.fullName}
                        icon={<UserOutlined />}
                        style={{ width: '2rem', height: '2rem' }}
                    />
                </Col>
                <Col flex="auto">
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Row justify="space-between" align="middle">
                            <Space>
                                <Text strong>{comment.user.fullName}</Text>
                                <Text type="secondary" style={{ fontSize: '0.85em' }}>
                                    {relativeDate(new Date(comment.createdAt))}
                                </Text>
                            </Space>
                            {isCommentOwner && !isEditing && (
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: `edit_comment_${comment._id}_${
                                                    comment.parentComment || 'parent'
                                                }`,
                                                icon: <EditOutlined />,
                                                label: 'Chỉnh sửa',
                                                onClick: () => setIsEditing(true),
                                            },
                                            {
                                                key: `delete_comment_${comment._id}_${
                                                    comment.parentComment || 'parent'
                                                }`,
                                                icon: <DeleteOutlined />,
                                                label: (
                                                    <Popconfirm
                                                        title="Bạn có chắc chắn muốn xóa bình luận này?"
                                                        onConfirm={handleDeleteComment}
                                                        okText="Xóa"
                                                        cancelText="Hủy"
                                                    >
                                                        Xóa
                                                    </Popconfirm>
                                                ),
                                                danger: true,
                                            },
                                        ],
                                    }}
                                >
                                    <Button icon={<MoreOutlined />} />
                                </Dropdown>
                            )}
                        </Row>
                        {isEditing ? (
                            <TextArea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                autoSize={{ minRows: 2, maxRows: 6 }}
                            />
                        ) : (
                            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                                {comment.content}
                            </Paragraph>
                        )}
                        <Space>
                            {isLoggedIn && (
                                <Button
                                    type="text"
                                    onClick={() => setReplyVisible(!replyVisible)}
                                    icon={<CommentOutlined />}
                                    style={{ paddingLeft: 0 }}
                                >
                                    Trả lời
                                </Button>
                            )}
                            {isEditing && (
                                <>
                                    <Button type="primary" onClick={handleEditComment}>
                                        Lưu
                                    </Button>
                                    <Button onClick={() => setIsEditing(false)}>Hủy</Button>
                                </>
                            )}
                        </Space>
                    </Space>
                </Col>
            </Row>
            {replyVisible && isLoggedIn && (
                <Row>
                    <Col span={24}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <TextArea
                                ref={textAreaRef}
                                rows={3}
                                placeholder="Viết bình luận của bạn..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                style={{ minHeight: '3.75rem' }}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleCreateComment}
                                loading={isCreating}
                                disabled={!newComment.trim() || isCreating}
                            >
                                Trả lời
                            </Button>
                        </Space>
                    </Col>
                </Row>
            )}
            {comment.replies && comment.replies.data.length > 0 && (
                <List
                    dataSource={comment.replies.data}
                    renderItem={(reply) => (
                        <List.Item
                            style={{ borderBottom: 'none', paddingLeft: isNested ? 0 : '2rem' }}
                        >
                            <Comment
                                comment={{ ...reply, _id: comment._id }}
                                isLoggedIn={isLoggedIn}
                                currentUserId={currentUserId}
                                isNested={true}
                                refetch={refetch}
                            />
                        </List.Item>
                    )}
                />
            )}
        </Space>
    );
};
