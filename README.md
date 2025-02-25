# passport-twitter-oauth2

[Passport](https://www.passportjs.org/) strategy for authenticating with Twitter using OAuth 2.0 and PKCE, with support for refresh tokens and enhanced profile data.

## Features

- OAuth 2.0 authentication with Twitter
- PKCE support enabled by default
- Refresh token support via `offline.access` scope
- Enhanced user profile data including profile images and metrics
- TypeScript support
- Automatic state parameter handling
- Comprehensive test coverage

## Install

```bash
npm install passport-twitter-oauth2-ravigaai
```

## Usage

#### Configure Strategy

The strategy supports authentication with comprehensive user profile data and refresh tokens:

```javascript
const passport = require('passport');
const TwitterStrategy = require('passport-twitter-oauth2-ravigaai');

passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    scope: [
      'tweet.read',
      'users.read',
      'offline.access', // For refresh tokens
      'email'          // For email access (if granted by user)
    ],
    // Optional: customize which profile fields to request
    profileFields: 'description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type,withheld'
  },
  function(accessToken, refreshToken, profile, cb) {
    // Available profile data:
    // - Basic: id, username, displayName
    // - Photos: profile.photos[0].value (profile image URL)
    // - Profile: description, location, url
    // - Status: verified, verifiedType, protected
    // - Metrics: followers, following, etc. (in profile.metrics)
    User.findOrCreate({ 
      twitterId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      profileImage: profile.photos?.[0]?.value,
      refreshToken // Store securely
    }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authentication Routes

```javascript
// Initialize authentication
app.get('/auth/twitter',
  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access', 'email']
  }));

// Handle callback
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
```

## Profile Fields

The strategy returns a rich user profile that may include:

- `id`: The user's Twitter ID
- `username`: The user's Twitter handle
- `displayName`: The user's display name
- `photos`: Array of profile images (if available)
- `description`: User's bio
- `location`: User's location
- `verified`: Verification status
- `verifiedType`: Type of verification
- `metrics`: Public metrics (followers, following, etc.)
- `url`: User's website
- `protected`: Protected tweet status

Note: Some fields may be undefined if the user hasn't set them or if the required scopes aren't granted.

## Refresh Token Support

To enable refresh token support:

1. Add the `offline.access` scope to your authentication request
2. Store the refresh token securely when received
3. Use the refresh token to obtain new access tokens when needed

Example implementation in the callback:

```javascript
passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    scope: ['tweet.read', 'users.read', 'offline.access']
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Store tokens securely
      const user = await User.findOrCreate({ 
        twitterId: profile.id,
        accessToken,
        refreshToken // Store securely for future use
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
