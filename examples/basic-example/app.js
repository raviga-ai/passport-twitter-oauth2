const express = require('express');
const session = require('express-session');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter-oauth2-ravigaai');

const app = express();

// Session setup (required for state parameter)
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());

// Strategy setup
passport.use(new TwitterStrategy({
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/callback/twitter',
    scope: ['tweet.read', 'users.read', 'offline.access']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // In a real app, you would:
      // 1. Find or create user in your database
      // 2. Return user object
      const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName
      };
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Routes
app.get('/', (req, res) => {
  res.send('<a href="/auth/twitter">Login with Twitter</a>');
});

// Initialize Twitter OAuth flow
app.get('/auth/twitter',
  passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access'],
    session: false
  })
);

// Twitter OAuth callback
app.get('/auth/callback/twitter',
  passport.authenticate('twitter', { 
    session: false,
    failureRedirect: '/login?error=auth_failed'
  }),
  (req, res) => {
    // Authentication successful
    const user = req.user;
    
    // In a real app, you might:
    // 1. Generate JWT
    // 2. Set cookies
    // 3. Redirect to frontend with user data
    
    res.json({ 
      success: true, 
      user
    });
  }
);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
