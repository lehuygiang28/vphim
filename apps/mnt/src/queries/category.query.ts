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

export const MNT_CATEGORY_CREATE = gql`
    mutation CreateCategory($input: CreateCategoryInput!) {
        createCategory(input: $input) {
            _id
        }
    }
`;

export const MNT_CATEGORY_QUERY = gql`
    query GetCategory($input: GetCategoryInput!) {
        category(input: $input) {
            _id
            name
            slug
        }
    }
`;

export const MNT_CATEGORY_UPDATE = gql`
    mutation UpdateCategory($input: UpdateCategoryInput!) {
        updateCategory(input: $input) {
            _id
        }
    }
`;

export const MNT_CATEGORY_DELETE = gql`
    mutation HardDeleteCategory($input: DeleteCategoryInput!) {
        deleteCategory(input: $input)
    }
`;
