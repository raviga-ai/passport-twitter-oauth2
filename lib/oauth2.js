const util = require('util');
const OAuth2Strategy = require('passport-oauth2');
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;
const logger = require('./logger');

const profileUrl = 'https://api.twitter.com/2/users/me';

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = 'https://twitter.com/i/oauth2/authorize';
  options.tokenURL = 'https://api.twitter.com/2/oauth2/token';
  options.scope = options.scope || ['tweet.read', 'users.read'];
  
  // Enable PKCE by default
  options.pkce = true;
  options.state = true;

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
    }
    return oldRequest(method, url, headers, post_body, null, callback);
  };
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function(accessToken, done) {
  logger.info('Fetching user profile with access token');
  this._oauth2.get(this.profileUrl, accessToken, (err, body, res) => {
    if (err) {
      logger.error('Failed to fetch user profile', { error: err });
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      const profile = parseProfile(body);
      logger.info('User profile fetched successfully', { profile });
      done(null, profile);
    } catch (e) {
      logger.error('Failed to parse user profile', { error: e });
      done(new InternalOAuthError('Failed to parse user profile', e));
    }
  });
};

function parseProfile(body) {
  const json = JSON.parse(body);
  const data = json.data;

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
