# passport-twitter-oauth2 Example

This example demonstrates how to use the passport-twitter-oauth2 module to authenticate users using Twitter's OAuth 2.0 API.

## Instructions

1. Register your application at [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)

2. Set environment variables:
```bash
export TWITTER_CLIENT_ID="your_client_id"
export TWITTER_CLIENT_SECRET="your_client_secret"
export CALLBACK_URL="http://localhost:3000/auth/twitter/callback"
```

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
node server.js
```

5. Visit [http://localhost:3000](http://localhost:3000)

## Important Notes

- Make sure your Twitter App has OAuth 2.0 enabled
- Configure the callback URL in your Twitter App settings
- The example uses session support to maintain login state
- PKCE and state parameters are enabled by default for security 