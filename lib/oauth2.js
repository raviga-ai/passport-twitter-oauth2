const util = require('util');
const crypto = require('crypto');
const OAuth2Strategy = require('passport-oauth2');
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;
const logger = require('./logger');

const profileUrl = 'https://api.twitter.com/2/users/me';
const defaultProfileFields = 'description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type,withheld';

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = 'https://twitter.com/i/oauth2/authorize';
  options.tokenURL = 'https://api.twitter.com/2/oauth2/token';

  options.scope = options.scope || ['tweet.read', 'users.read', 'offline.access', 'email'];
  options.pkce = true; // Always enable PKCE
  options.state = true;

  // Token headers
  options.customHeaders = {
    ...options.customHeaders,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  OAuth2Strategy.call(this, options, verify);

  this.name = 'twitter';
  this.profileUrl = profileUrl;
  this._profileFields = options.profileFields || defaultProfileFields;
}

util.inherits(Strategy, OAuth2Strategy);

// 👇 Dynamic PKCE injection
Strategy.prototype.tokenParams = function(options = {}) {
  const req = options.req;
  const params = {
    grant_type: 'authorization_code'
  };

  if (req) {
    const verifier =
      req.session?.codeVerifier || req.cookies?.['oauth_code_verifier_twitter'];

    if (verifier) {
      params.code_verifier = verifier;
      logger.info('[Twitter Strategy] Using PKCE verifier from request');
    } else {
      logger.warn('[Twitter Strategy] PKCE verifier is missing!');
    }
  }

  return params;
};

Strategy.prototype.userProfile = function(accessToken, done) {
  logger.info('[Twitter Strategy] Fetching user profile');

  const userFields = this._profileFields;
  const profileUrlWithFields = `${this.profileUrl}?user.fields=${userFields}`;

  // Manually make the request with Authorization header
  this._oauth2._request(
    'GET',
    profileUrlWithFields,
    {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    null,
    null,
    async (err, body, res) => {
      if (err) {
        logger.error('Failed to fetch user profile', { error: err.message, statusCode: err.statusCode });
        return done(new InternalOAuthError('Failed to fetch user profile', err));
      }

      try {
        const profile = parseProfile(body);

        logger.info('[Twitter Strategy] User profile fetched successfully');
        return done(null, profile);
      } catch (e) {
        logger.error('Failed to parse user profile', { error: e.message });
        return done(new InternalOAuthError('Failed to parse user profile', e));
      }
    }
  );
};

function parseProfile(body) {
  const json = JSON.parse(body);
  const data = json.data;

  if (!data) {
    throw new Error('Invalid profile data received from Twitter');
  }

  const profile = {
    provider: 'twitter',
    id: data.id,
    username: data.username,
    displayName: data.name,
    photos: data.profile_image_url ? [{ value: data.profile_image_url }] : undefined,
    description: data.description,
    location: data.location,
    verified: data.verified,
    verifiedType: data.verified_type,
    metrics: data.public_metrics,
    url: data.url,
    protected: data.protected,
    _raw: body,
    _json: json
  };

  return profile;
}

module.exports = Strategy;