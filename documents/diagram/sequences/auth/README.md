# Authentication Flow Sequence Diagrams

This directory contains PlantUML sequence diagrams showing the authentication flows implemented in the application.

## Files

- **auth-complete-flow.puml**: Complete authentication flows in a single diagram
- **auth-registration-flow.puml**: User registration flow
- **auth-email-confirmation-flow.puml**: Email confirmation flow after registration
- **auth-passwordless-login-flow.puml**: Passwordless login with magic link or OTP
- **auth-social-login-flow.puml**: Social login flows (Google and GitHub)
- **auth-token-refresh-flow.puml**: Token refresh flow

## How to View

You can view these diagrams with any PlantUML compatible viewer, including:

1. PlantUML extension for VS Code
2. Online PlantUML viewer at [PlantText](https://www.planttext.com/)
3. The official [PlantUML server](http://www.plantuml.com/plantuml/uml/)

## Diagram Breakdown

### Registration Flow
- User submits registration form
- System creates a new user if email doesn't exist
- Confirmation email is sent with a hash token
- User receives 204 No Content with confirmation message

### Email Confirmation
- User clicks confirmation link in email
- System verifies hash token and confirms email
- User account is marked as verified

### Passwordless Login
- User submits email
- System generates magic link and OTP
- User can either click the magic link or enter the OTP
- System verifies and provides authentication tokens

### Social Login (Google/GitHub)
- User authenticates with social provider
- System verifies the token with the provider
- Creates new user if email doesn't exist
- Returns authentication tokens

### Token Refresh
- Frontend automatically refreshes token when needed
- System verifies refresh token, checks user status
- Issues new access and refresh tokens

## Security Considerations

- All tokens are signed with JWT
- Tokens have configurable expiry times
- Redis is used to store temporary tokens with expiry
- One-time use tokens for email verification and passwordless login
- Email verification is enforced across all authentication methods 