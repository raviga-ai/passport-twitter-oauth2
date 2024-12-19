const util = require('util');
const crypto = require('crypto');
const OAuth2Strategy = require('passport-oauth2');
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;
const logger = require('./logger');

const profileUrl = 'https://api.twitter.com/2/users/me';

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = 'https://twitter.com/i/oauth2/authorize';
  options.tokenURL = 'https://api.twitter.com/2/oauth2/token';
  options.scope = options.scope || ['tweet.read', 'users.read'];
  
  // Enable PKCE and state by default for security
  options.pkce = true;
  options.state = true;

  // Generate PKCE verifier and challenge
  if (options.pkce) {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
    
    options.pkceVerifier = verifier;
    options.pkceChallenge = challenge;
    options.pkceChallengeMethod = 'S256';
  }

  OAuth2Strategy.call(this, options, verify);

  this.name = 'twitter';
  this.profileUrl = profileUrl;

  // Override the oauth2 _request method to use Bearer authentication
  const oauth2 = this._oauth2;
  const oldRequest = oauth2._request.bind(oauth2);
  oauth2._request = function(method, url, headers, post_body, access_token, callback) {
    headers = headers || {};
    if (access_token) {
      headers['Authorization'] = 'Bearer ' + access_token;
      // Remove access_token from post_body if it exists since we're using header
      if (post_body) {
        const params = new URLSearchParams(post_body);
        params.delete('access_token');
        post_body = params.toString();
      }
    }
    return oldRequest(method, url, headers, post_body, null, callback);
  };
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function(accessToken, done) {
  logger.info('Fetching user profile with access token');
  
  this._oauth2.get(this.profileUrl, accessToken, (err, body, res) => {
    if (err) {
      logger.error('Failed to fetch user profile', { 
        error: err.message,
        statusCode: err.statusCode
      });
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      const profile = parseProfile(body);
      logger.info('User profile fetched successfully');
      done(null, profile);
    } catch (e) {
      logger.error('Failed to parse user profile', { error: e.message });
      done(new InternalOAuthError('Failed to parse user profile', e));
    }
  });
};

function parseProfile(body) {
  const json = JSON.parse(body);
  const data = json.data;

  if (!data) {
    throw new Error('Invalid profile data received from Twitter');
  }

  return {
    provider: 'twitter',
    id: data.id,
    username: data.username,
    displayName: data.name,
    _raw: body,
    _json: json
  };
}

module.exports = Strategy;
