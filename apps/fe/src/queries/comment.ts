import gql from 'graphql-tag';

export const COMMENT_LIST_QUERY = gql`
    query GetComments($input: GetCommentsInput!) {
        movieComments(input: $input) {
            total
            count
            data {
                _id
                content
                movie
                createdAt
                updatedAt
                user {
                    _id
                    fullName
                    avatar {
                        url
                    }
                }
                replies {
                    total
                    count
                    data {
                        _id
                        movie
                        content
                        parentComment
                        createdAt
                        updatedAt
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
        }
    }
`;

export const CREATE_COMMENT_MUTATION = gql`
    mutation CreateComment($input: CreateCommentInput!) {
        createComment(input: $input) {
            _id
        }
    }
`;

export const UPDATE_COMMENT_MUTATION = gql`
    mutation UpdateComment($input: UpdateCommentInput!) {
        updateComment(input: $input) {
            _id
        }
    }
`;

export const DELETE_COMMENT_MUTATION = gql`
    mutation DeleteComment($input: DeleteCommentInput!) {
        deleteComment(input: $input)
    }
`;
