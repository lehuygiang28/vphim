import gql from 'graphql-tag';

export const MNT_CATEGORIES_LIST_QUERY = gql`
    query GetCategories($input: GetCategoriesInput!) {
        categories(input: $input) {
            data {
                _id
                name
                slug
            }
            total
        }
    }
`;
