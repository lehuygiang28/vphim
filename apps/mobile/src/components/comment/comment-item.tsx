import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    ActionSheetIOS,
    Modal,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Avatar, Text, Input, useTheme, Button, Spinner } from '@ui-kitten/components';
import { MessageCircle, MoreHorizontal, User, Send } from 'lucide-react-native';
import { useCreate, useDelete, useUpdate } from '@refinedev/core';
import { noop } from 'lodash';

import type { CommentType } from '~api/app/comments/comment.type';
import type { UserType } from '~api/app/users/user.type';
import { isNullOrUndefined } from '~fe/libs/utils/common';
import {
    CREATE_COMMENT_MUTATION,
    DELETE_COMMENT_MUTATION,
    UPDATE_COMMENT_MUTATION,
} from '~fe/queries/comment';
import { relativeDate } from '~fe/libs/utils/relative-date';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';

interface CommentItemProps {
    comment: CommentType;
    isLoggedIn: boolean;
    currentUserId: string | undefined;
    refetch?: () => void;
    user?: UserType;
    isNested?: boolean;
}

export function CommentItem(
    props: CommentItemProps = {
        comment: {} as CommentType,
        isLoggedIn: false,
        currentUserId: undefined,
        refetch: noop,
        user: undefined,
        isNested: false,
    },
) {
    const { comment, isLoggedIn, currentUserId, refetch, user, isNested } = props;

    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [replyVisible, setReplyVisible] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [showOptions, setShowOptions] = useState(false);

    const { mutate: createComment, isLoading: isCreating } = useCreate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: CREATE_COMMENT_MUTATION,
            operation: 'createComment',
        },
    });

    const { mutate: editComment, isLoading: isLoadingEditing } = useUpdate({
        dataProviderName: 'graphql',
        resource: 'comments',
        meta: {
            gqlMutation: UPDATE_COMMENT_MUTATION,
            operation: 'updateComment',
        },
    });

    const { mutate: deleteComment, isLoading: isDeleting } = useDelete();

    const handleCreateComment = useCallback(() => {
        if (isNullOrUndefined(newComment) || newComment.trim() === '') {
            return;
        }

        createComment(
            {
                values: {
                    movieId: comment.movie?.toString(),
                    parentCommentId: comment?.parentComment?.toString() || comment._id?.toString(),
                    content: newComment,
                },
            },
            {
                onSuccess: () => {
                    setNewComment('');
                    setReplyVisible(false);
                    refetch?.();
                },
            },
        );
    }, [comment._id, comment.movie, comment?.parentComment, createComment, newComment, refetch]);

    const handleEditComment = useCallback(() => {
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
            },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    setShowOptions(false);
                    refetch?.();
                },
            },
        );
    }, [editComment, comment._id, editedContent, refetch]);

    const handleDeleteComment = useCallback(() => {
        deleteComment(
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
            },
            {
                onSuccess: () => {
                    refetch?.();
                },
            },
        );
    }, [deleteComment, comment._id, refetch]);

    const confirmDelete = useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Hủy bỏ', 'Xóa'],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0,
                    title: 'Xác nhận xóa',
                    message: 'Bạn có chắc chắn muốn xóa bình luận này?',
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleDeleteComment();
                    }
                },
            );
        } else {
            Alert.alert(
                'Xác nhận xóa',
                'Bạn có chắc chắn muốn xóa bình luận này?',
                [
                    {
                        text: 'Hủy bỏ',
                        style: 'cancel',
                    },
                    {
                        text: 'Xóa',
                        onPress: handleDeleteComment,
                        style: 'destructive',
                    },
                ],
                { cancelable: false },
            );
        }
    }, [handleDeleteComment]);

    const showActionOptions = useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Hủy bỏ', 'Chỉnh sửa', 'Xóa'],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        setIsEditing(true);
                    } else if (buttonIndex === 2) {
                        confirmDelete();
                    }
                },
            );
        } else {
            setShowOptions(true);
        }
    }, [confirmDelete]);

    const isCommentOwner = currentUserId === comment.user._id?.toString();
    const avatarSize = !isNested ? 'small' : 'tiny';

    return (
        <View style={[styles.container, isNested && styles.nestedContainer]}>
            <View style={styles.commentHeader}>
                <View style={styles.avatarContainer}>
                    <Avatar
                        size={avatarSize}
                        source={{
                            uri: comment.user?.avatar?.url
                                ? getOptimizedImageUrl(comment.user.avatar.url, {
                                      width: 40,
                                      height: 40,
                                      quality: 80,
                                  })
                                : undefined,
                        }}
                        ImageComponent={() => (
                            <View
                                style={[
                                    styles.avatarIconContainer,
                                    isNested && styles.nestedAvatarIconContainer,
                                ]}
                            >
                                <User
                                    size={!isNested ? 24 : 20}
                                    color={theme['text-basic-color']}
                                />
                            </View>
                        )}
                    />
                </View>
                <View style={styles.commentContent}>
                    <View style={[styles.commentBubble, isNested && styles.nestedCommentBubble]}>
                        <Text category="s1" style={styles.username}>
                            {comment.user.fullName}
                        </Text>
                        {isEditing ? (
                            <Input
                                multiline
                                textStyle={styles.editInput}
                                value={editedContent}
                                onChangeText={setEditedContent}
                                disabled={isLoadingEditing}
                            />
                        ) : (
                            <Text style={{ color: theme['text-basic-color'] }}>
                                {comment.content}
                            </Text>
                        )}
                    </View>
                    <View style={styles.actionsContainer}>
                        {isLoggedIn && (
                            <TouchableOpacity
                                style={styles.action}
                                onPress={() => setReplyVisible(!replyVisible)}
                            >
                                <MessageCircle size={16} color={theme['text-hint-color']} />
                                <Text category="c1" style={styles.actionText}>
                                    Trả lời
                                </Text>
                            </TouchableOpacity>
                        )}
                        <Text category="c1" style={styles.timestamp}>
                            {relativeDate(new Date(comment.createdAt))}
                        </Text>
                    </View>
                </View>
                {isCommentOwner && (
                    <TouchableOpacity onPress={showActionOptions} style={styles.moreButton}>
                        <MoreHorizontal size={16} color={theme['text-hint-color']} />
                    </TouchableOpacity>
                )}
            </View>

            {Platform.OS === 'android' && showOptions && (
                <Modal
                    transparent
                    visible={showOptions}
                    onRequestClose={() => setShowOptions(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        onPress={() => setShowOptions(false)}
                    >
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    setIsEditing(true);
                                    setShowOptions(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>Chỉnh sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    confirmDelete();
                                    setShowOptions(false);
                                }}
                            >
                                <Text style={styles.deleteText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {replyVisible && isLoggedIn && (
                <View style={styles.replyContainer}>
                    <Input
                        placeholder="Viết trả lời..."
                        value={newComment}
                        onChangeText={setNewComment}
                        style={styles.replyInput}
                        disabled={isCreating}
                    />
                    <TouchableOpacity
                        onPress={handleCreateComment}
                        disabled={!newComment.trim() || isCreating}
                        style={[
                            styles.sendButton,
                            (!newComment.trim() || isCreating) && styles.sendButtonDisabled,
                        ]}
                    >
                        {isCreating ? (
                            <Spinner size="small" />
                        ) : (
                            <Send
                                size={20}
                                color={
                                    !newComment.trim() || isCreating
                                        ? theme['text-disabled-color']
                                        : theme['text-primary-color']
                                }
                            />
                        )}
                    </TouchableOpacity>
                </View>
            )}
            {isEditing && (
                <View style={styles.editActions}>
                    <Button
                        size="small"
                        onPress={handleEditComment}
                        style={styles.editButton}
                        disabled={isLoadingEditing}
                    >
                        Lưu
                    </Button>
                    <Button
                        size="small"
                        appearance="ghost"
                        onPress={() => {
                            setIsEditing(false);
                            setEditedContent(comment.content);
                        }}
                        style={styles.cancelButton}
                        disabled={isLoadingEditing}
                    >
                        Hủy
                    </Button>
                </View>
            )}

            {comment?.replies && (comment?.replies?.data?.length || 0) > 0 && (
                <View style={styles.repliesContainer}>
                    {comment?.replies?.data?.map((reply) => (
                        <CommentItem
                            key={`${reply._id?.toString()}-${new Date(
                                reply?.updatedAt,
                            )?.getTime()}`}
                            comment={{ ...reply, _id: reply._id }}
                            isLoggedIn={isLoggedIn}
                            currentUserId={currentUserId}
                            refetch={refetch}
                            user={user}
                            isNested
                        />
                    ))}
                </View>
            )}
            {isDeleting && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme['color-primary-500']} />
                </View>
            )}
        </View>
    );
}

const createStyles = (theme: Record<string, string>) =>
    StyleSheet.create({
        container: {
            marginBottom: 16,
            marginHorizontal: 16,
        },
        nestedContainer: {
            marginLeft: 24,
            paddingLeft: 16,
        },
        commentHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
        },
        avatarContainer: {
            marginRight: 8,
        },
        commentContent: {
            flex: 1,
        },
        commentBubble: {
            backgroundColor: theme['background-basic-color-4'],
            borderRadius: 18,
            padding: 12,
        },
        nestedCommentBubble: {
            backgroundColor: theme['background-basic-color-3'],
        },
        username: {
            fontWeight: 'bold',
            marginBottom: 4,
            color: theme['text-basic-color'],
        },
        actionsContainer: {
            flexDirection: 'row',
            marginTop: 4,
            alignItems: 'center',
        },
        action: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
        },
        actionText: {
            color: theme['text-hint-color'],
            marginLeft: 4,
        },
        timestamp: {
            color: theme['text-hint-color'],
        },
        moreButton: {
            padding: 8,
        },
        replyContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            marginLeft: 48,
        },
        replyInput: {
            flex: 1,
            marginRight: 8,
            backgroundColor: theme['background-basic-color-1'],
            borderColor: theme['border-basic-color-3'],
        },
        sendButton: {
            padding: 8,
        },
        sendButtonDisabled: {
            opacity: 0.5,
        },
        editActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 8,
        },
        editButton: {
            marginRight: 8,
        },
        cancelButton: {
            borderColor: 'transparent',
        },
        editInput: {
            minHeight: 40,
            backgroundColor: theme['background-basic-color-1'],
            borderColor: theme['border-basic-color-3'],
            color: theme['text-basic-color'],
        },
        repliesContainer: {
            marginTop: 16,
        },
        avatarIconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme['background-basic-color-3'],
            justifyContent: 'center',
            alignItems: 'center',
        },
        nestedAvatarIconContainer: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme['background-basic-color-1'],
            borderRadius: 10,
            padding: 20,
            width: '80%',
        },
        modalOption: {
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: theme['border-basic-color-3'],
        },
        modalOptionText: {
            color: theme['text-basic-color'],
        },
        deleteText: {
            color: theme['color-danger-500'],
        },
        loadingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
        },
    });