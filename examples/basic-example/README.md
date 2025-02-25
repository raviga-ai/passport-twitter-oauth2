# Basic Example - passport-twitter-oauth2

This is a basic example showing how to use the passport-twitter-oauth2 strategy in an Express application.

## Setup

1. Copy `.env.example` to `.env` and fill in your Twitter OAuth 2.0 credentials:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Visit http://localhost:3000 and click "Login with Twitter"

## Implementation Notes

This example demonstrates:
- Basic Passport.js setup with the Twitter OAuth 2.0 strategy
- Session handling for state parameter
- Basic error handling
- User profile retrieval

In a production environment, you would want to:
1. Use a proper session store (not the default MemoryStore)
2. Implement proper user database integration
3. Add JWT or session-based authentication
4. Add proper error handling and logging
5. Use HTTPS
6. Add CSRF protection
