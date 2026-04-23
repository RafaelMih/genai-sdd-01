# Feature Spec: Auth

Version: 1.0.0
Status: Approved

## Objective

Allow users to sign in with email and password.

## Scope

- login page
- form validation
- Firebase Auth sign-in
- redirect after success
- friendly auth error

## Out of scope

- Google sign-in
- password reset
- MFA

## User flow

1. User opens the login page
2. User enters email and password
3. System validates fields
4. System attempts Firebase authentication
5. On success, redirect to dashboard
6. On failure, show friendly error message

## Acceptance criteria

- Invalid email shows validation error
- Empty password shows validation error
- Wrong credentials show friendly auth error
- Successful login redirects to dashboard

## Dependencies

- specs/technical/security-rules-v1.0.0.md

## Tests

- validation unit test
- login submit integration test

## Open questions

- dashboard path should be /dashboard or /app?
