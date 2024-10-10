import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Button, List, Typography, Input, Row, Col } from 'antd';
import { CommentOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import { useCreate } from '@refinedev/core';

import { CommentType } from 'apps/api/src/app/comments/comment.type';
import { CREATE_COMMENT_MUTATION } from '@/queries/comment';
import { isNullOrUndefined } from 'apps/api/src/libs/utils/common';
import { relativeDate } from '@/libs/utils/relative-date';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CommentProps {
    comment: CommentType;
}

export const Comment: React.FC<CommentProps> = ({ comment }) => {
    const [replyVisible, setReplyVisible] = useState(false);
    const [newComment, setNewComment] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const { mutate: createComment, isLoading } = useCreate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: CREATE_COMMENT_MUTATION,
            operation: 'createComment',
        },
    });

    useEffect(() => {
        if (replyVisible && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [replyVisible]);

    const handleCreateComment = () => {
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
            },
            {
                onSuccess: () => {
                    setNewComment('');
                    setReplyVisible(false);
                },
            },
        );
    };

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Row gutter={[16, 0]}>
                    <Col span={4} md={1}>
                        <Avatar
                            src={comment.user?.avatar?.url}
                            alt={comment.user.fullName}
                            icon={<UserOutlined />}
                            style={{ width: '2.5rem', height: '2.5rem' }}
                        />
                    </Col>
                    <Col flex="auto" span={20} md={23}>
                        <Row gutter={[0, 8]}>
                            <Col span={24}>
                                <Text strong>{comment.user.fullName}</Text>
                                <Text
                                    type="secondary"
                                    style={{ fontSize: '0.85em', marginLeft: '0.5rem' }}
                                >
                                    {relativeDate(new Date(comment.createdAt))}
                                </Text>
                            </Col>
                            <Col span={24}>
                                <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
                                    {comment.content}
                                </Paragraph>
                            </Col>
                            <Col span={24}>
                                <Button
                                    type="text"
                                    onClick={() => setReplyVisible(!replyVisible)}
                                    icon={<CommentOutlined />}
                                    style={{ paddingLeft: 0 }}
                                >
                                    Trả lời
                                </Button>
                            </Col>
                            {replyVisible && (
                                <Col span={24}>
                                    <Row gutter={[0, 8]}>
                                        <Col span={24}>
                                            <TextArea
                                                ref={textAreaRef}
                                                rows={3}
                                                placeholder="Viết bình luận của bạn..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                style={{ minHeight: '3.75rem' }}
                                            />
                                        </Col>
                                        <Col span={24}>
                                            <Button
                                                type="primary"
                                                icon={<SendOutlined />}
                                                onClick={handleCreateComment}
                                                loading={isLoading}
                                                disabled={!newComment.trim() || isLoading}
                                            >
                                                Trả lời
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                            )}
                        </Row>
                    </Col>
                </Row>
            </Col>
            {comment.replies && comment.replies.data.length > 0 && (
                <Col span={24}>
                    <List
                        dataSource={comment.replies.data}
                        renderItem={(reply) => (
                            <List.Item style={{ borderBottom: 'none', paddingLeft: '2.5rem' }}>
                                <Comment comment={{ ...reply, _id: comment._id }} />
                            </List.Item>
                        )}
                    />
                </Col>
            )}
        </Row>
    );
};
