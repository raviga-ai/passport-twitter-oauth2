const express = require('express');
const passport = require('passport');
const TwitterStrategy = require('../lib').Strategy;
const logger = require('../lib/logger');

// API Access link for creating client ID and secret:
// https://developer.twitter.com/en/portal/dashboard
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/twitter/callback';

// Passport session setup
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the TwitterStrategy within Passport
passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['tweet.read', 'users.read'],
    state: true,
    pkce: true,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    logger.info('User authenticated with Twitter', { profile });
    try {
      req.session.accessToken = accessToken;
      return done(null, profile);
    } catch (error) {
      logger.error('Error during authentication', { error });
      return done(error);
    }
  }
));

const app = express();

// Express configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

// Routes
app.get('/', function(req, res) {
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', { user: req.user });
});

app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res) {
    // The request will be redirected to Twitter for authentication
  }
);

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// Start server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Authentication check middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}
