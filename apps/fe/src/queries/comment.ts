import gql from 'graphql-tag';

export const COMMENT_LIST_QUERY = gql`
    query GetComments($input: GetCommentsInput!) {
        movieComments(input: $input) {
            total
            count
            hasMore
            currentPage
            data {
                _id
                content
                movieId
                createdAt
                updatedAt
                editedAt
                replyCount
                user {
                    _id
                    fullName
                    avatar {
                        url
                    }
                }
            }
        }
    }
`;

export const COMMENT_REPLIES_QUERY = gql`
    query GetCommentReplies($input: GetCommentRepliesInput!) {
        commentReplies(input: $input) {
            total
            count
            hasMore
            currentPage
            data {
                _id
                movieId
                content
                parentComment
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
    }
`;

export const CREATE_COMMENT_MUTATION = gql`
    mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) {
            _id
            content
            movieId
            createdAt
            updatedAt
            editedAt
            replyCount
            parentComment
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

export const UPDATE_COMMENT_MUTATION = gql`
    mutation UpdateComment($input: UpdateCommentInput!) {
        updateComment(input: $input) {
            _id
            content
            movieId
            createdAt
            updatedAt
            editedAt
            replyCount
            parentComment
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

export const DELETE_COMMENT_MUTATION = gql`
    mutation DeleteComment($input: DeleteCommentInput!) {
        deleteComment(input: $input)
    }
`;
