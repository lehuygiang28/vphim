import gql from 'graphql-tag';

// Get comments for a movie (top level comments)
export const COMMENT_LIST_QUERY = gql`
    query GetComments($input: GetCommentsInput!) {
        movieComments(input: $input) {
            data {
                _id
                content
                movieId
                parentComment
                rootParentComment
                nestingLevel
                replyCount
                createdAt
                updatedAt
                editedAt
                user {
                    _id
                    fullName
                    avatar {
                        url
                    }
                }
            }
            total
            count
            hasMore
            currentPage
        }
    }
`;

// Get replies for a comment (nested comments)
export const COMMENT_REPLIES_QUERY = gql`
    query GetCommentReplies($input: GetCommentRepliesInput!) {
        commentReplies(input: $input) {
            data {
                _id
                content
                movieId
                parentComment
                rootParentComment
                nestingLevel
                replyCount
                createdAt
                updatedAt
                editedAt
                user {
                    _id
                    fullName
                    avatar {
                        url
                    }
                }
            }
            total
            count
            hasMore
            currentPage
        }
    }
`;

// Create
export const CREATE_COMMENT_MUTATION = gql`
    mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) {
            _id
            content
            movieId
            parentComment
            rootParentComment
            nestingLevel
            replyCount
            createdAt
            updatedAt
            editedAt
            user {
                _id
                fullName
                avatar {
                    url
                }
            }
        }
    }
`;

// Update
export const UPDATE_COMMENT_MUTATION = gql`
    mutation UpdateComment($input: UpdateCommentInput!) {
        updateComment(input: $input) {
            _id
            content
            movieId
            parentComment
            rootParentComment
            nestingLevel
            replyCount
            createdAt
            updatedAt
            editedAt
            user {
                _id
                fullName
                avatar {
                    url
                }
            }
        }
    }
`;

// Delete
export const DELETE_COMMENT_MUTATION = gql`
    mutation DeleteComment($input: DeleteCommentInput!) {
        deleteComment(input: $input)
    }
`;
