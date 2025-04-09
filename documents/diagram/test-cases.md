# API Test Cases

## 1. Authentication

| Test Case Number | 1.1.1 |
| :---- | :---- |
| Test Case Name | Sign up for an account |
| Test Case Description | This case tests the registration function when the registration information is entered correctly and the server is running smoothly. |
| Preconditions | User must use an unused email to create an account. |
| Test Case Input | Enter your correct email to create a new account, then the system will send a code to your email for user confirmation. |
| Test Case Expected Output | The system will return a successful registration message with status code 204 (No Content). |
| Test Case Steps | 1. Input: User will use an email that has not been registered on the system, and enter username.<br>2. Output: The system will display a successful registration message and send a confirmation code to the provided email. |

| Test Case Number | 1.1.2 |
| :---- | :---- |
| Test Case Name | Sign up with existing email (Failure case) |
| Test Case Description | This case tests the registration function when attempting to register with an email that's already in use. |
| Preconditions | Email is already associated with an existing account |
| Test Case Input | Enter an email that's already registered in the system |
| Test Case Expected Output | The system will return an error message indicating the email is already in use with an appropriate error code. |
| Test Case Steps | 1. Input: User submits registration with an email already registered in the system.<br>2. Output: System returns an error response indicating the email is already in use. |

| Test Case Number | 1.1.3 |
| :---- | :---- |
| Test Case Name | Confirm account registration |
| Test Case Description | Tests the account confirmation functionality after receiving a confirmation hash via email. |
| Preconditions | User has already initiated registration and received a confirmation hash via email. |
| Test Case Input | The hash code received in the email. |
| Test Case Expected Output | The system will confirm the registration with status code 204 (No Content). |
| Test Case Steps | 1. Input: User submits the hash received via email to the registration confirmation endpoint.<br>2. Output: The system successfully confirms the account. |

| Test Case Number | 1.1.4 |
| :---- | :---- |
| Test Case Name | Confirm account with invalid hash (Failure case) |
| Test Case Description | Tests the account confirmation with an invalid or expired hash. |
| Preconditions | User has an invalid or expired confirmation hash. |
| Test Case Input | An invalid confirmation hash. |
| Test Case Expected Output | The system will return an error message indicating the hash is invalid or expired. |
| Test Case Steps | 1. Input: User submits an invalid hash to the confirmation endpoint.<br>2. Output: System returns an error response. |

| Test Case Number | 1.2.1 |
| :---- | :---- |
| Test Case Name | Passwordless login request |
| Test Case Description | Tests the passwordless login functionality by requesting a login link via email. |
| Preconditions | User has a registered and confirmed account. |
| Test Case Input | The email address associated with the user's account. |
| Test Case Expected Output | The system will send a login link to the user's email and return a status code 200 (OK). |
| Test Case Steps | 1. Input: User enters email address.<br>2. Output: System sends a login link to the provided email. |

| Test Case Number | 1.2.2 |
| :---- | :---- |
| Test Case Name | Passwordless login request with non-existent email (Failure case) |
| Test Case Description | Tests the passwordless login functionality when an unregistered email is provided. |
| Preconditions | Email is not associated with any registered account. |
| Test Case Input | An email that is not registered in the system. |
| Test Case Expected Output | The system will return an appropriate error message indicating the email is not registered. |
| Test Case Steps | 1. Input: User enters an unregistered email address.<br>2. Output: System returns an error response. |

| Test Case Number | 1.2.3 |
| :---- | :---- |
| Test Case Name | Validate passwordless login |
| Test Case Description | Tests validating a passwordless login with the hash received via email. |
| Preconditions | User has requested a passwordless login and received a hash via email. |
| Test Case Input | The hash from the email and the user's email address. |
| Test Case Expected Output | The system will authenticate the user and return a login response with access/refresh tokens. |
| Test Case Steps | 1. Input: User submits the hash received via email along with their email address.<br>2. Output: System authenticates the user and provides access and refresh tokens. |

| Test Case Number | 1.2.4 |
| :---- | :---- |
| Test Case Name | Google login authentication |
| Test Case Description | Tests the login functionality using Google authentication. |
| Preconditions | User has a Google account that can be used for authentication. |
| Test Case Input | Google authentication data (token and related information). |
| Test Case Expected Output | The system will authenticate the user using Google credentials and return a login response with access/refresh tokens. |
| Test Case Steps | 1. Input: User provides Google authentication data.<br>2. Output: System verifies the Google credentials and provides access and refresh tokens. |

| Test Case Number | 1.2.5 |
| :---- | :---- |
| Test Case Name | GitHub login authentication |
| Test Case Description | Tests the login functionality using GitHub authentication. |
| Preconditions | User has a GitHub account that can be used for authentication. |
| Test Case Input | GitHub authentication data (token and related information). |
| Test Case Expected Output | The system will authenticate the user using GitHub credentials and return a login response with access/refresh tokens. |
| Test Case Steps | 1. Input: User provides GitHub authentication data.<br>2. Output: System verifies the GitHub credentials and provides access and refresh tokens. |

| Test Case Number | 1.2.6 |
| :---- | :---- |
| Test Case Name | Refresh auth token |
| Test Case Description | Tests refreshing the authentication token using a valid refresh token. |
| Preconditions | User has valid refresh token from a previous login. |
| Test Case Input | The refresh token. |
| Test Case Expected Output | The system will issue a new access token and refresh token pair. |
| Test Case Steps | 1. Input: User submits refresh token.<br>2. Output: System provides new access and refresh tokens. |

| Test Case Number | 1.2.7 |
| :---- | :---- |
| Test Case Name | Refresh with invalid token (Failure case) |
| Test Case Description | Tests refreshing authentication with an invalid or expired refresh token. |
| Preconditions | User has an invalid or expired refresh token. |
| Test Case Input | An invalid refresh token. |
| Test Case Expected Output | The system will return an error message indicating the token is invalid or expired. |
| Test Case Steps | 1. Input: User submits an invalid refresh token.<br>2. Output: System returns an error response. |

## 2. User Management

| Test Case Number | 2.1.1 |
| :---- | :---- |
| Test Case Name | Get user information |
| Test Case Description | Tests retrieving user information using GraphQL. |
| Preconditions | User is authenticated. |
| Test Case Input | GraphQL query to getMe endpoint. |
| Test Case Expected Output | The system will return the user's profile information including followed movies. |
| Test Case Steps | 1. Input: User makes GraphQL query for their own information.<br>2. Output: System returns user data including profile information and followed movies. |

| Test Case Number | 2.1.2 |
| :---- | :---- |
| Test Case Name | Get user information without authentication (Failure case) |
| Test Case Description | Tests retrieving user information without being authenticated. |
| Preconditions | User is not authenticated. |
| Test Case Input | GraphQL query to getMe endpoint without authentication. |
| Test Case Expected Output | The system will return an authentication error. |
| Test Case Steps | 1. Input: Unauthenticated user makes GraphQL query for user information.<br>2. Output: System returns authentication error. |

| Test Case Number | 2.1.3 |
| :---- | :---- |
| Test Case Name | Update user profile information |
| Test Case Description | Tests updating user profile information using GraphQL. |
| Preconditions | User is authenticated. |
| Test Case Input | GraphQL mutation with updated user information (fullName, avatar). |
| Test Case Expected Output | The system will update the user's profile and return the updated profile information. |
| Test Case Steps | 1. Input: User submits mutation with updated profile information.<br>2. Output: System updates the profile and returns updated information. |

| Test Case Number | 2.2.1 |
| :---- | :---- |
| Test Case Name | Follow a movie |
| Test Case Description | Tests the functionality of following a movie using GraphQL. |
| Preconditions | User is authenticated and movie exists. |
| Test Case Input | GraphQL mutation with movieSlug parameter. |
| Test Case Expected Output | The system will add the movie to the user's followed movies and return updated user information. |
| Test Case Steps | 1. Input: User submits mutation with the movie's slug to follow.<br>2. Output: System adds movie to user's followed list and returns updated user data. |

| Test Case Number | 2.2.2 |
| :---- | :---- |
| Test Case Name | Follow a non-existent movie (Failure case) |
| Test Case Description | Tests following a movie that doesn't exist. |
| Preconditions | User is authenticated and the movie slug is invalid. |
| Test Case Input | GraphQL mutation with non-existent movieSlug. |
| Test Case Expected Output | The system will return an error indicating the movie was not found. |
| Test Case Steps | 1. Input: User submits mutation with an invalid movie slug.<br>2. Output: System returns a not found error. |

| Test Case Number | 2.2.3 |
| :---- | :---- |
| Test Case Name | Unfollow a movie |
| Test Case Description | Tests the functionality of unfollowing a movie using GraphQL. |
| Preconditions | User is authenticated and has already followed the movie. |
| Test Case Input | GraphQL mutation with movieSlug parameter. |
| Test Case Expected Output | The system will remove the movie from the user's followed movies and return updated user information. |
| Test Case Steps | 1. Input: User submits mutation with the movie's slug to unfollow.<br>2. Output: System removes movie from user's followed list and returns updated user data. |

| Test Case Number | 2.3.1 |
| :---- | :---- |
| Test Case Name | Get list of users (Admin only) |
| Test Case Description | Tests the admin functionality to retrieve a list of all users. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | Query parameters for pagination and filtering. |
| Test Case Expected Output | The system will return a paginated list of users matching the filter criteria. |
| Test Case Steps | 1. Input: Admin sends request with optional filtering parameters.<br>2. Output: System returns list of users. |

| Test Case Number | 2.3.2 |
| :---- | :---- |
| Test Case Name | Get list of users as non-admin (Failure case) |
| Test Case Description | Tests accessing the admin user list functionality without admin rights. |
| Preconditions | User is authenticated but does not have admin role. |
| Test Case Input | Request to the users endpoint. |
| Test Case Expected Output | The system will return a permission error. |
| Test Case Steps | 1. Input: Non-admin user attempts to access user list.<br>2. Output: System returns a permission error. |

| Test Case Number | 2.3.3 |
| :---- | :---- |
| Test Case Name | Create user (Admin only) |
| Test Case Description | Tests the admin functionality to create a new user. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | User data including email, fullName, and other required fields. |
| Test Case Expected Output | The system will create a new user and return the user data with status code 201 (Created). |
| Test Case Steps | 1. Input: Admin submits new user data.<br>2. Output: System creates user and returns the created user data. |

| Test Case Number | 2.3.4 |
| :---- | :---- |
| Test Case Name | Block user (Admin only) |
| Test Case Description | Tests the admin functionality to block a user. |
| Preconditions | User is authenticated with admin role and target user exists. |
| Test Case Input | Target user ID and block data. |
| Test Case Expected Output | The system will block the user and return the updated user data. |
| Test Case Steps | 1. Input: Admin submits user ID to block with reason data.<br>2. Output: System blocks the user and returns updated user data. |

| Test Case Number | 2.3.5 |
| :---- | :---- |
| Test Case Name | Unblock user (Admin only) |
| Test Case Description | Tests the admin functionality to unblock a user. |
| Preconditions | User is authenticated with admin role and target user is blocked. |
| Test Case Input | Target user ID. |
| Test Case Expected Output | The system will unblock the user and return the updated user data. |
| Test Case Steps | 1. Input: Admin submits user ID to unblock.<br>2. Output: System unblocks the user and returns updated user data. |

## 3. Movies

| Test Case Number | 3.1.1 |
| :---- | :---- |
| Test Case Name | Get movie information |
| Test Case Description | Tests retrieving detailed information about a specific movie. |
| Preconditions | The movie exists in the system. |
| Test Case Input | Movie slug as a route parameter. |
| Test Case Expected Output | The system will return detailed information about the requested movie. |
| Test Case Steps | 1. Input: User requests movie information via slug.<br>2. Output: System returns detailed movie information. |

| Test Case Number | 3.1.2 |
| :---- | :---- |
| Test Case Name | Get non-existent movie (Failure case) |
| Test Case Description | Tests retrieving a movie that doesn't exist. |
| Preconditions | The movie slug is invalid or doesn't exist. |
| Test Case Input | Non-existent movie slug. |
| Test Case Expected Output | The system will return a not found error with appropriate status code. |
| Test Case Steps | 1. Input: User requests non-existent movie.<br>2. Output: System returns not found error. |

| Test Case Number | 3.1.3 |
| :---- | :---- |
| Test Case Name | Search and filter movies |
| Test Case Description | Tests searching and filtering movies with various parameters. |
| Preconditions | Movies exist in the database. |
| Test Case Input | Search parameters such as title, category, region, year, etc. |
| Test Case Expected Output | The system will return a paginated list of movies matching the search criteria. |
| Test Case Steps | 1. Input: User submits search/filter parameters.<br>2. Output: System returns matching movies in a paginated format. |

| Test Case Number | 3.1.4 |
| :---- | :---- |
| Test Case Name | Get movie via GraphQL |
| Test Case Description | Tests retrieving movie information using GraphQL query. |
| Preconditions | The movie exists in the system. |
| Test Case Input | GraphQL query with movie slug or ID. |
| Test Case Expected Output | The system will return the movie information in GraphQL format. |
| Test Case Steps | 1. Input: User submits GraphQL query for movie.<br>2. Output: System returns movie data in GraphQL format. |

| Test Case Number | 3.1.5 |
| :---- | :---- |
| Test Case Name | List movies using GraphQL |
| Test Case Description | Tests retrieving a list of movies with filtering using GraphQL. |
| Preconditions | Movies exist in the database. |
| Test Case Input | GraphQL query with filter parameters. |
| Test Case Expected Output | The system will return a paginated list of movies matching the criteria. |
| Test Case Steps | 1. Input: User submits GraphQL query with filters.<br>2. Output: System returns filtered movie list. |

| Test Case Number | 3.2.1 |
| :---- | :---- |
| Test Case Name | Update movie views |
| Test Case Description | Tests updating view count for a movie. |
| Preconditions | The movie exists in the system. |
| Test Case Input | Movie slug. |
| Test Case Expected Output | The system will increment the view count for the specified movie. |
| Test Case Steps | 1. Input: System submits movie slug to update views.<br>2. Output: System increases the view count for the movie. |

| Test Case Number | 3.3.1 |
| :---- | :---- |
| Test Case Name | Create movie (Admin only) |
| Test Case Description | Tests creating a new movie using GraphQL. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with movie data. |
| Test Case Expected Output | The system will create a new movie and return the movie data. |
| Test Case Steps | 1. Input: Admin submits movie creation data via GraphQL.<br>2. Output: System creates and returns the new movie. |

| Test Case Number | 3.3.2 |
| :---- | :---- |
| Test Case Name | Create movie as non-admin (Failure case) |
| Test Case Description | Tests movie creation by a user without admin privileges. |
| Preconditions | User is authenticated but doesn't have admin role. |
| Test Case Input | GraphQL mutation with movie data. |
| Test Case Expected Output | The system will return a permission error. |
| Test Case Steps | 1. Input: Non-admin user attempts to create a movie.<br>2. Output: System returns permission error. |

| Test Case Number | 3.3.3 |
| :---- | :---- |
| Test Case Name | Update movie (Admin only) |
| Test Case Description | Tests updating an existing movie using GraphQL. |
| Preconditions | User is authenticated with admin role and movie exists. |
| Test Case Input | GraphQL mutation with updated movie data. |
| Test Case Expected Output | The system will update the movie and return the updated movie data. |
| Test Case Steps | 1. Input: Admin submits movie update data via GraphQL.<br>2. Output: System updates and returns the modified movie. |

| Test Case Number | 3.3.4 |
| :---- | :---- |
| Test Case Name | Hard delete movie (Admin only) |
| Test Case Description | Tests permanently deleting a movie using GraphQL. |
| Preconditions | User is authenticated with admin role and movie exists. |
| Test Case Input | GraphQL mutation with movie ID to delete. |
| Test Case Expected Output | The system will delete the movie and return status integer. |
| Test Case Steps | 1. Input: Admin submits movie ID to delete via GraphQL.<br>2. Output: System deletes the movie and returns success status. |

| Test Case Number | 3.3.5 |
| :---- | :---- |
| Test Case Name | List movies for admin |
| Test Case Description | Tests retrieving a list of movies with admin-specific fields using GraphQL. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL query with admin-specific filter parameters. |
| Test Case Expected Output | The system will return a paginated list of movies with admin-specific fields. |
| Test Case Steps | 1. Input: Admin submits GraphQL query for movies with admin filters.<br>2. Output: System returns enhanced movie list with admin data. |

| Test Case Number | 3.3.6 |
| :---- | :---- |
| Test Case Name | Create movie with invalid category IDs (Failure case) |
| Test Case Description | Tests movie creation with category IDs that don't exist. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with movie data containing non-existent category IDs. |
| Test Case Expected Output | The system will return an error indicating invalid category IDs. |
| Test Case Steps | 1. Input: Admin submits movie creation data with non-existent category IDs.<br>2. Output: System returns an error about invalid categories. |

| Test Case Number | 3.3.7 |
| :---- | :---- |
| Test Case Name | Create movie with invalid region IDs (Failure case) |
| Test Case Description | Tests movie creation with region IDs that don't exist. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with movie data containing non-existent region IDs. |
| Test Case Expected Output | The system will return an error indicating invalid region IDs. |
| Test Case Steps | 1. Input: Admin submits movie creation data with non-existent region IDs.<br>2. Output: System returns an error about invalid regions. |

| Test Case Number | 3.3.8 |
| :---- | :---- |
| Test Case Name | Create movie with duplicate slug (Failure case) |
| Test Case Description | Tests movie creation with a slug that already exists. |
| Preconditions | User is authenticated with admin role and a movie with the same slug already exists. |
| Test Case Input | GraphQL mutation with movie data containing an existing slug. |
| Test Case Expected Output | The system will return a BadRequestException with a "Slug already exists" message. |
| Test Case Steps | 1. Input: Admin submits movie creation with an existing slug.<br>2. Output: System returns an error indicating the slug already exists. |

## 4. Categories

| Test Case Number | 4.1.1 |
| :---- | :---- |
| Test Case Name | Get categories list |
| Test Case Description | Tests retrieving a list of all categories using REST API. |
| Preconditions | Categories exist in the database. |
| Test Case Input | Query parameters for filtering and pagination. |
| Test Case Expected Output | The system will return a paginated list of categories. |
| Test Case Steps | 1. Input: User makes GET request to /categories endpoint with optional query parameters.<br>2. Output: System returns list of categories. |

| Test Case Number | 4.1.2 |
| :---- | :---- |
| Test Case Name | Get categories via GraphQL |
| Test Case Description | Tests retrieving categories using GraphQL. |
| Preconditions | Categories exist in the database. |
| Test Case Input | GraphQL query with optional filtering parameters. |
| Test Case Expected Output | The system will return a list of categories in GraphQL format. |
| Test Case Steps | 1. Input: User submits GraphQL query for categories.<br>2. Output: System returns categories list in GraphQL format. |

| Test Case Number | 4.1.3 |
| :---- | :---- |
| Test Case Name | Get single category via GraphQL |
| Test Case Description | Tests retrieving a specific category by ID or slug using GraphQL. |
| Preconditions | The category exists in the system. |
| Test Case Input | GraphQL query with category ID or slug. |
| Test Case Expected Output | The system will return the specific category information. |
| Test Case Steps | 1. Input: User submits GraphQL query with category ID or slug.<br>2. Output: System returns category data. |

| Test Case Number | 4.1.4 |
| :---- | :---- |
| Test Case Name | Get non-existent category (Failure case) |
| Test Case Description | Tests retrieving a category that doesn't exist. |
| Preconditions | The category ID or slug is invalid. |
| Test Case Input | GraphQL query with invalid category ID or slug. |
| Test Case Expected Output | The system will return a not found error. |
| Test Case Steps | 1. Input: User submits GraphQL query with invalid category ID or slug.<br>2. Output: System returns not found error. |

| Test Case Number | 4.2.1 |
| :---- | :---- |
| Test Case Name | Create category (Admin only) |
| Test Case Description | Tests creating a new category using GraphQL. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with category name and slug. |
| Test Case Expected Output | The system will create a new category and return the category data. |
| Test Case Steps | 1. Input: Admin submits category creation data via GraphQL.<br>2. Output: System creates and returns the new category. |

| Test Case Number | 4.2.2 |
| :---- | :---- |
| Test Case Name | Update category (Admin only) |
| Test Case Description | Tests updating an existing category using GraphQL. |
| Preconditions | User is authenticated with admin role and category exists. |
| Test Case Input | GraphQL mutation with updated category data. |
| Test Case Expected Output | The system will update the category and return the updated category data. |
| Test Case Steps | 1. Input: Admin submits category update data via GraphQL.<br>2. Output: System updates and returns the modified category. |

| Test Case Number | 4.2.3 |
| :---- | :---- |
| Test Case Name | Delete category (Admin only) |
| Test Case Description | Tests deleting a category using GraphQL. |
| Preconditions | User is authenticated with admin role and category exists. |
| Test Case Input | GraphQL mutation with category ID to delete. |
| Test Case Expected Output | The system will delete the category and return the number of deleted records. |
| Test Case Steps | 1. Input: Admin submits category ID to delete via GraphQL.<br>2. Output: System deletes the category and returns deletion count. |

| Test Case Number | 4.2.4 |
| :---- | :---- |
| Test Case Name | Create category with invalid slug format (Failure case) |
| Test Case Description | Tests creating a category with a slug that contains invalid characters. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with category name and invalid slug (containing uppercase letters, spaces, or special characters). |
| Test Case Expected Output | The system will return a validation error stating "Slug can only contain lowercase letters, numbers, and hyphens". |
| Test Case Steps | 1. Input: Admin submits category creation data with invalid slug format.<br>2. Output: System returns a validation error about slug format. |

| Test Case Number | 4.2.5 |
| :---- | :---- |
| Test Case Name | Create category with duplicate slug (Failure case) |
| Test Case Description | Tests creating a category with a slug that already exists. |
| Preconditions | User is authenticated with admin role and a category with the same slug already exists. |
| Test Case Input | GraphQL mutation with category name and an existing slug. |
| Test Case Expected Output | The system will return a BadRequestException with a "Slug already exists" message. |
| Test Case Steps | 1. Input: Admin submits category creation with an existing slug.<br>2. Output: System returns an error indicating the slug already exists. |

| Test Case Number | 4.2.6 |
| :---- | :---- |
| Test Case Name | Update non-existent category (Failure case) |
| Test Case Description | Tests updating a category that doesn't exist. |
| Preconditions | User is authenticated with admin role and the category ID is invalid. |
| Test Case Input | GraphQL mutation with non-existent category ID and updated data. |
| Test Case Expected Output | The system will return a not found error. |
| Test Case Steps | 1. Input: Admin submits update for a non-existent category.<br>2. Output: System returns a not found error. |

## 5. Regions

| Test Case Number | 5.1.1 |
| :---- | :---- |
| Test Case Name | Get regions list |
| Test Case Description | Tests retrieving a list of all regions/countries using REST API. |
| Preconditions | Regions exist in the database. |
| Test Case Input | Query parameters for filtering and pagination. |
| Test Case Expected Output | The system will return a paginated list of regions. |
| Test Case Steps | 1. Input: User makes GET request to /regions endpoint with optional query parameters.<br>2. Output: System returns list of regions. |

| Test Case Number | 5.1.2 |
| :---- | :---- |
| Test Case Name | Get regions via GraphQL |
| Test Case Description | Tests retrieving regions using GraphQL. |
| Preconditions | Regions exist in the database. |
| Test Case Input | GraphQL query with optional filtering parameters. |
| Test Case Expected Output | The system will return a list of regions in GraphQL format. |
| Test Case Steps | 1. Input: User submits GraphQL query for regions.<br>2. Output: System returns regions list in GraphQL format. |

| Test Case Number | 5.1.3 |
| :---- | :---- |
| Test Case Name | Get single region via GraphQL |
| Test Case Description | Tests retrieving a specific region by ID or slug using GraphQL. |
| Preconditions | The region exists in the system. |
| Test Case Input | GraphQL query with region ID or slug. |
| Test Case Expected Output | The system will return the specific region information. |
| Test Case Steps | 1. Input: User submits GraphQL query with region ID or slug.<br>2. Output: System returns region data. |

| Test Case Number | 5.2.1 |
| :---- | :---- |
| Test Case Name | Create region (Admin only) |
| Test Case Description | Tests creating a new region using GraphQL. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with region name and slug. |
| Test Case Expected Output | The system will create a new region and return the region data. |
| Test Case Steps | 1. Input: Admin submits region creation data via GraphQL.<br>2. Output: System creates and returns the new region. |

| Test Case Number | 5.2.2 |
| :---- | :---- |
| Test Case Name | Update region (Admin only) |
| Test Case Description | Tests updating an existing region using GraphQL. |
| Preconditions | User is authenticated with admin role and region exists. |
| Test Case Input | GraphQL mutation with updated region data. |
| Test Case Expected Output | The system will update the region and return the updated region data. |
| Test Case Steps | 1. Input: Admin submits region update data via GraphQL.<br>2. Output: System updates and returns the modified region. |

| Test Case Number | 5.2.3 |
| :---- | :---- |
| Test Case Name | Delete region (Admin only) |
| Test Case Description | Tests deleting a region using GraphQL. |
| Preconditions | User is authenticated with admin role and region exists. |
| Test Case Input | GraphQL mutation with region ID to delete. |
| Test Case Expected Output | The system will delete the region and return the number of deleted records. |
| Test Case Steps | 1. Input: Admin submits region ID to delete via GraphQL.<br>2. Output: System deletes the region and returns deletion count. |

| Test Case Number | 5.2.4 |
| :---- | :---- |
| Test Case Name | Create region with invalid slug format (Failure case) |
| Test Case Description | Tests creating a region with a slug that contains invalid characters. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with region name and invalid slug (containing uppercase letters, spaces, or special characters). |
| Test Case Expected Output | The system will return a validation error stating "Slug can only contain lowercase letters, numbers, and hyphens". |
| Test Case Steps | 1. Input: Admin submits region creation data with invalid slug format.<br>2. Output: System returns a validation error about slug format. |

| Test Case Number | 5.2.5 |
| :---- | :---- |
| Test Case Name | Create region with duplicate slug (Failure case) |
| Test Case Description | Tests creating a region with a slug that already exists. |
| Preconditions | User is authenticated with admin role and a region with the same slug already exists. |
| Test Case Input | GraphQL mutation with region name and an existing slug. |
| Test Case Expected Output | The system will return a BadRequestException with a "Slug already exists" message. |
| Test Case Steps | 1. Input: Admin submits region creation with an existing slug.<br>2. Output: System returns an error indicating the slug already exists. |

| Test Case Number | 5.2.6 |
| :---- | :---- |
| Test Case Name | Update non-existent region (Failure case) |
| Test Case Description | Tests updating a region that doesn't exist. |
| Preconditions | User is authenticated with admin role and the region ID is invalid. |
| Test Case Input | GraphQL mutation with non-existent region ID and updated data. |
| Test Case Expected Output | The system will return a not found error. |
| Test Case Steps | 1. Input: Admin submits update for a non-existent region.<br>2. Output: System returns a not found error. |

## 6. Actors

| Test Case Number | 6.1.1 |
| :---- | :---- |
| Test Case Name | Get actors list |
| Test Case Description | Tests retrieving a list of all actors using REST API. |
| Preconditions | Actors exist in the database. |
| Test Case Input | Query parameters for filtering and pagination. |
| Test Case Expected Output | The system will return a paginated list of actors. |
| Test Case Steps | 1. Input: User makes GET request to /actors endpoint with optional query parameters.<br>2. Output: System returns list of actors. |

| Test Case Number | 6.1.2 |
| :---- | :---- |
| Test Case Name | Get actors via GraphQL |
| Test Case Description | Tests retrieving actors using GraphQL. |
| Preconditions | Actors exist in the database. |
| Test Case Input | GraphQL query with optional filtering parameters. |
| Test Case Expected Output | The system will return a list of actors in GraphQL format. |
| Test Case Steps | 1. Input: User submits GraphQL query for actors.<br>2. Output: System returns actors list in GraphQL format. |

| Test Case Number | 6.1.3 |
| :---- | :---- |
| Test Case Name | Get single actor via GraphQL |
| Test Case Description | Tests retrieving a specific actor by ID or slug using GraphQL. |
| Preconditions | The actor exists in the system. |
| Test Case Input | GraphQL query with actor ID or slug. |
| Test Case Expected Output | The system will return the specific actor information. |
| Test Case Steps | 1. Input: User submits GraphQL query with actor ID or slug.<br>2. Output: System returns actor data. |

| Test Case Number | 6.2.1 |
| :---- | :---- |
| Test Case Name | Create actor (Admin only) |
| Test Case Description | Tests creating a new actor using GraphQL. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with actor details (name, avatar, description, etc.). |
| Test Case Expected Output | The system will create a new actor and return the actor data. |
| Test Case Steps | 1. Input: Admin submits actor creation data via GraphQL.<br>2. Output: System creates and returns the new actor. |

| Test Case Number | 6.2.2 |
| :---- | :---- |
| Test Case Name | Update actor (Admin only) |
| Test Case Description | Tests updating an existing actor using GraphQL. |
| Preconditions | User is authenticated with admin role and actor exists. |
| Test Case Input | GraphQL mutation with updated actor data. |
| Test Case Expected Output | The system will update the actor and return the updated actor data. |
| Test Case Steps | 1. Input: Admin submits actor update data via GraphQL.<br>2. Output: System updates and returns the modified actor. |

| Test Case Number | 6.2.3 |
| :---- | :---- |
| Test Case Name | Delete actor (Admin only) |
| Test Case Description | Tests deleting an actor using GraphQL. |
| Preconditions | User is authenticated with admin role and actor exists. |
| Test Case Input | GraphQL mutation with actor ID to delete. |
| Test Case Expected Output | The system will delete the actor and return the number of deleted records. |
| Test Case Steps | 1. Input: Admin submits actor ID to delete via GraphQL.<br>2. Output: System deletes the actor and returns deletion count. |

| Test Case Number | 6.2.4 |
| :---- | :---- |
| Test Case Name | Create actor with duplicate slug (Failure case) |
| Test Case Description | Tests creating an actor with a slug that already exists. |
| Preconditions | User is authenticated with admin role and an actor with the same slug already exists. |
| Test Case Input | GraphQL mutation with actor details including an existing slug. |
| Test Case Expected Output | The system will return a BadRequestException with a "Slug already exists" message. |
| Test Case Steps | 1. Input: Admin submits actor creation with an existing slug.<br>2. Output: System returns an error indicating the slug already exists. |

| Test Case Number | 6.2.5 |
| :---- | :---- |
| Test Case Name | Get actor with invalid ID (Failure case) |
| Test Case Description | Tests retrieving an actor with an invalid ID format. |
| Preconditions | The ID provided is not a valid MongoDB ObjectId. |
| Test Case Input | GraphQL query with invalid actor ID format. |
| Test Case Expected Output | The system will return a validation error about the invalid ID format. |
| Test Case Steps | 1. Input: User submits GraphQL query with invalid ID format.<br>2. Output: System returns a validation error about the ID format. |

| Test Case Number | 6.2.6 |
| :---- | :---- |
| Test Case Name | Update non-existent actor (Failure case) |
| Test Case Description | Tests updating an actor that doesn't exist. |
| Preconditions | User is authenticated with admin role and the actor ID is invalid. |
| Test Case Input | GraphQL mutation with non-existent actor ID and updated data. |
| Test Case Expected Output | The system will return a not found error. |
| Test Case Steps | 1. Input: Admin submits update for a non-existent actor.<br>2. Output: System returns a not found error. |

## 7. Directors

| Test Case Number | 7.1.1 |
| :---- | :---- |
| Test Case Name | Get directors list |
| Test Case Description | Tests retrieving a list of all directors using REST API. |
| Preconditions | Directors exist in the database. |
| Test Case Input | Query parameters for filtering and pagination. |
| Test Case Expected Output | The system will return a paginated list of directors. |
| Test Case Steps | 1. Input: User makes GET request to /directors endpoint with optional query parameters.<br>2. Output: System returns list of directors. |

| Test Case Number | 7.1.2 |
| :---- | :---- |
| Test Case Name | Get directors via GraphQL |
| Test Case Description | Tests retrieving directors using GraphQL. |
| Preconditions | Directors exist in the database. |
| Test Case Input | GraphQL query with optional filtering parameters. |
| Test Case Expected Output | The system will return a list of directors in GraphQL format. |
| Test Case Steps | 1. Input: User submits GraphQL query for directors.<br>2. Output: System returns directors list in GraphQL format. |

| Test Case Number | 7.1.3 |
| :---- | :---- |
| Test Case Name | Get single director via GraphQL |
| Test Case Description | Tests retrieving a specific director by ID or slug using GraphQL. |
| Preconditions | The director exists in the system. |
| Test Case Input | GraphQL query with director ID or slug. |
| Test Case Expected Output | The system will return the specific director information. |
| Test Case Steps | 1. Input: User submits GraphQL query with director ID or slug.<br>2. Output: System returns director data. |

| Test Case Number | 7.2.1 |
| :---- | :---- |
| Test Case Name | Create director (Admin only) |
| Test Case Description | Tests creating a new director using GraphQL. |
| Preconditions | User is authenticated with admin role. |
| Test Case Input | GraphQL mutation with director details (name, avatar, description, etc.). |
| Test Case Expected Output | The system will create a new director and return the director data. |
| Test Case Steps | 1. Input: Admin submits director creation data via GraphQL.<br>2. Output: System creates and returns the new director. |

| Test Case Number | 7.2.2 |
| :---- | :---- |
| Test Case Name | Update director (Admin only) |
| Test Case Description | Tests updating an existing director using GraphQL. |
| Preconditions | User is authenticated with admin role and director exists. |
| Test Case Input | GraphQL mutation with updated director data. |
| Test Case Expected Output | The system will update the director and return the updated director data. |
| Test Case Steps | 1. Input: Admin submits director update data via GraphQL.<br>2. Output: System updates and returns the modified director. |

| Test Case Number | 7.2.3 |
| :---- | :---- |
| Test Case Name | Delete director (Admin only) |
| Test Case Description | Tests deleting a director using GraphQL. |
| Preconditions | User is authenticated with admin role and director exists. |
| Test Case Input | GraphQL mutation with director ID to delete. |
| Test Case Expected Output | The system will delete the director and return the number of deleted records. |
| Test Case Steps | 1. Input: Admin submits director ID to delete via GraphQL.<br>2. Output: System deletes the director and returns deletion count. |

| Test Case Number | 7.2.4 |
| :---- | :---- |
| Test Case Name | Create director with duplicate slug (Failure case) |
| Test Case Description | Tests creating a director with a slug that already exists. |
| Preconditions | User is authenticated with admin role and a director with the same slug already exists. |
| Test Case Input | GraphQL mutation with director details including an existing slug. |
| Test Case Expected Output | The system will return a BadRequestException with a "Slug already exists" message. |
| Test Case Steps | 1. Input: Admin submits director creation with an existing slug.<br>2. Output: System returns an error indicating the slug already exists. |

| Test Case Number | 7.2.5 |
| :---- | :---- |
| Test Case Name | Get director with invalid ID (Failure case) |
| Test Case Description | Tests retrieving a director with an invalid ID format. |
| Preconditions | The ID provided is not a valid MongoDB ObjectId. |
| Test Case Input | GraphQL query with invalid director ID format. |
| Test Case Expected Output | The system will return a validation error about the invalid ID format. |
| Test Case Steps | 1. Input: User submits GraphQL query with invalid ID format.<br>2. Output: System returns a validation error about the ID format. |

| Test Case Number | 7.2.6 |
| :---- | :---- |
| Test Case Name | Update non-existent director (Failure case) |
| Test Case Description | Tests updating a director that doesn't exist. |
| Preconditions | User is authenticated with admin role and the director ID is invalid. |
| Test Case Input | GraphQL mutation with non-existent director ID and updated data. |
| Test Case Expected Output | The system will return a not found error. |
| Test Case Steps | 1. Input: Admin submits update for a non-existent director.<br>2. Output: System returns a not found error. |

## 8. Comments

| Test Case Number | 8.1.1 |
| :---- | :---- |
| Test Case Name | Create a movie comment |
| Test Case Description | Tests creating a new comment on a movie. |
| Preconditions | User is authenticated and the movie exists. |
| Test Case Input | GraphQL mutation with comment content and movie ID. |
| Test Case Expected Output | The system will create a new comment and return the comment details. |
| Test Case Steps | 1. Input: User submits comment text and movie ID.<br>2. Output: System creates and returns the new comment. |

| Test Case Number | 8.1.2 |
| :---- | :---- |
| Test Case Name | Create comment without authentication (Failure case) |
| Test Case Description | Tests creating a comment without being authenticated. |
| Preconditions | User is not authenticated. |
| Test Case Input | GraphQL mutation with comment content and movie ID. |
| Test Case Expected Output | The system will return an authentication error. |
| Test Case Steps | 1. Input: Unauthenticated user attempts to create a comment.<br>2. Output: System returns authentication error. |

| Test Case Number | 8.1.3 |
| :---- | :---- |
| Test Case Name | Update a movie comment |
| Test Case Description | Tests updating an existing comment. |
| Preconditions | User is authenticated and owns the comment. |
| Test Case Input | GraphQL mutation with updated comment content and comment ID. |
| Test Case Expected Output | The system will update the comment and return the updated comment details. |
| Test Case Steps | 1. Input: User submits updated comment text and comment ID.<br>2. Output: System updates and returns the modified comment. |

| Test Case Number | 8.1.4 |
| :---- | :---- |
| Test Case Name | Update another user's comment (Failure case) |
| Test Case Description | Tests updating a comment that belongs to another user. |
| Preconditions | User is authenticated but does not own the comment. |
| Test Case Input | GraphQL mutation with updated comment content and comment ID of another user's comment. |
| Test Case Expected Output | The system will return a permission error. |
| Test Case Steps | 1. Input: User attempts to update another user's comment.<br>2. Output: System returns permission error. |

| Test Case Number | 8.1.5 |
| :---- | :---- |
| Test Case Name | Delete a movie comment |
| Test Case Description | Tests deleting an existing comment. |
| Preconditions | User is authenticated and owns the comment. |
| Test Case Input | GraphQL mutation with comment ID to delete. |
| Test Case Expected Output | The system will delete the comment and return true. |
| Test Case Steps | 1. Input: User submits comment ID to delete.<br>2. Output: System deletes the comment and returns success confirmation. |

| Test Case Number | 8.1.6 |
| :---- | :---- |
| Test Case Name | Create comment for non-existent movie (Failure case) |
| Test Case Description | Tests creating a comment for a movie that doesn't exist. |
| Preconditions | User is authenticated and the movie ID is invalid. |
| Test Case Input | GraphQL mutation with comment content and non-existent movie ID. |
| Test Case Expected Output | The system will return a not found error for the movie. |
| Test Case Steps | 1. Input: User submits a comment for a non-existent movie.<br>2. Output: System returns a movie not found error. |

| Test Case Number | 8.1.7 |
| :---- | :---- |
| Test Case Name | Delete non-existent comment (Failure case) |
| Test Case Description | Tests deleting a comment that doesn't exist. |
| Preconditions | User is authenticated and the comment ID is invalid. |
| Test Case Input | GraphQL mutation with non-existent comment ID to delete. |
| Test Case Expected Output | The system will return a not found error. |
| Test Case Steps | 1. Input: User submits a deletion request for a non-existent comment.<br>2. Output: System returns a comment not found error. |

| Test Case Number | 8.1.8 |
| :---- | :---- |
| Test Case Name | Rate limit exceeded for comment creation (Failure case) |
| Test Case Description | Tests the behavior when a user exceeds the rate limit for creating comments. |
| Preconditions | User is authenticated and has recently created multiple comments. |
| Test Case Input | GraphQL mutation with comment content and movie ID after exceeding rate limit. |
| Test Case Expected Output | The system will return a rate limit exceeded error. |
| Test Case Steps | 1. Input: User rapidly submits multiple comment creation requests.<br>2. Output: System returns a rate limit exceeded error. |

| Test Case Number | 8.2.1 |
| :---- | :---- |
| Test Case Name | Get movie comments |
| Test Case Description | Tests retrieving comments for a specific movie with pagination. |
| Preconditions | The movie exists and has comments. |
| Test Case Input | GraphQL query with movie ID and pagination parameters. |
| Test Case Expected Output | The system will return a paginated list of comments for the movie. |
| Test Case Steps | 1. Input: User submits movie ID with pagination options.<br>2. Output: System returns paginated comments for the movie. |

| Test Case Number | 8.2.2 |
| :---- | :---- |
| Test Case Name | Get comment replies |
| Test Case Description | Tests retrieving replies to a specific comment with pagination. |
| Preconditions | The parent comment exists and has replies. |
| Test Case Input | GraphQL query with parent comment ID and pagination parameters. |
| Test Case Expected Output | The system will return a paginated list of replies to the specified comment. |
| Test Case Steps | 1. Input: User submits parent comment ID with pagination options.<br>2. Output: System returns paginated replies for the comment. |
