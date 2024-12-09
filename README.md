# passport-twitter-oauth2

[Passport](https://www.passportjs.org/) strategy for authenticating with Twitter using OAuth 2.0 and PKCE.

## Install

```bash
npm install passport-twitter-oauth2
```

## Usage

#### Configure Strategy

```javascript
const passport = require('passport');
const TwitterStrategy = require('passport-twitter-oauth2');

passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    scope: ['tweet.read', 'users.read']
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ twitterId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
```

#### Authenticate Requests

```javascript
app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
```

## Features

- OAuth 2.0 authentication with Twitter
- PKCE support enabled by default
- TypeScript support
- Automatic state parameter handling
- Comprehensive test coverage

## License

[MIT](LICENSE)
