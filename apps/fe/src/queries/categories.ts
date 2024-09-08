import gql from 'graphql-tag';

export const CATEGORIES_LIST_QUERY = gql`
    query GetCategories($input: GetCategoriesInput!) {
        categories(input: $input) {
            data {
                name
                slug
            }
            total
        }
    }
`;
