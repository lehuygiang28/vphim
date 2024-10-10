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
                    fullName
                    avatar {
                        url
                    }
                }
                replies {
                    total
                    count
                    data {
                        movie
                        content
                        createdAt
                        updatedAt
                        user {
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
            movie
        }
    }
`;
