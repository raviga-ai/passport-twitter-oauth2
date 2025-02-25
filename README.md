# passport-twitter-oauth2

[Passport](https://www.passportjs.org/) strategy for authenticating with Twitter using OAuth 2.0 and PKCE.

## Install

```bash
npm install passport-twitter-oauth2-ravigaai
```

## Usage

#### Configure Strategy

The strategy supports both basic authentication and refresh token functionality. Here's how to use it:

```javascript
const passport = require('passport');
const TwitterStrategy = require('passport-twitter-oauth2-ravigaai');

passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    scope: ['tweet.read', 'users.read'] // Add 'offline.access' for refresh tokens
  },
  function(accessToken, refreshToken, profile, cb) {
    // refreshToken will be available if 'offline.access' scope was requested
    User.findOrCreate({ 
      twitterId: profile.id,
      refreshToken: refreshToken // Store securely if needed
    }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

```javascript
// Basic authentication
app.get('/auth/twitter',
  passport.authenticate('twitter'));

// With refresh token support
app.get('/auth/twitter',
  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access']
  }));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
```

## Features

- OAuth 2.0 authentication with Twitter
- PKCE support enabled by default
- Refresh token support via `offline.access` scope
- TypeScript support
- Automatic state parameter handling
- Comprehensive test coverage

## Refresh Token Support

To enable refresh token support:

1. Add the `offline.access` scope to your authentication request
2. Store the refresh token securely when received
3. Use the refresh token to obtain new access tokens when needed

Example with refresh token:

```javascript
passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    scope: ['tweet.read', 'users.read', 'offline.access'] // Include offline.access
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Store tokens securely
      const user = await User.findOrCreate({ 
        twitterId: profile.id,
        accessToken,
        refreshToken
      });
      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));
```

## License

[MIT](LICENSE)
