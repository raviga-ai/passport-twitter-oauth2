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
  
  // Default scopes including email and more profile info
  const defaultScopes = ['tweet.read', 'users.read', 'offline.access', 'email'];
  options.scope = options.scope || defaultScopes;
  
  // Set profile fields
  this._profileFields = options.profileFields || defaultProfileFields;

  // Enable PKCE by default for security, but make state optional
  options.pkce = options.pkce !== false; // default to true unless explicitly set to false
  options.state = options.state !== undefined ? options.state : true; // default to true but allow override

  // Set OAuth2 parameters for refresh token
  if (!options.authorizationParams) {
    options.authorizationParams = {};
  }
  options.authorizationParams.access_type = 'offline';
  
  // Customize token parameters
  if (!options.customHeaders) {
    options.customHeaders = {};
  }
  options.customHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
  
  // Set custom parameters for token request
  if (!options.tokenParams) {
    options.tokenParams = {};
  }
  options.tokenParams.grant_type = 'authorization_code';

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
  
  // Override getOAuthAccessToken to properly handle refresh tokens
  const oldGetOAuthAccessToken = oauth2.getOAuthAccessToken.bind(oauth2);
  oauth2.getOAuthAccessToken = function(code, params, callback) {
    return oldGetOAuthAccessToken(code, params, function(err, accessToken, refreshToken, results) {
      if (err) {
        logger.error('OAuth token exchange failed', { error: err.message });
        return callback(err);
      }
      callback(null, accessToken, refreshToken, results);
    });
  };

  oauth2._request = function(method, url, headers, post_body, access_token, callback) {
    headers = headers || {};
    
    // Add required headers for Twitter OAuth2
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    
    if (access_token) {
      headers['Authorization'] = 'Bearer ' + access_token;
      // Remove access_token from post_body if it exists since we're using header
      if (post_body) {
        const params = new URLSearchParams(post_body);
        params.delete('access_token');
        post_body = params.toString();
      }
    } else if (url === options.tokenURL) {
      // For token endpoint, use Basic auth with client credentials
      const basicAuth = Buffer.from(`${options.clientID}:${options.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }
    
    return oldRequest(method, url, headers, post_body, null, function(err, body, res) {
      if (err) {
        logger.error('OAuth request failed', {
          statusCode: err.statusCode,
          error: err.message
        });
      }
      callback(err, body, res);
    });
  };
}

util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.userProfile = function(accessToken, done) {
  logger.info('Fetching user profile with access token');
  
  // Construct URL with user fields
  const userFields = this._profileFields;
  const profileUrlWithFields = `${this.profileUrl}?user.fields=${userFields}`;
  
  this._oauth2.get(profileUrlWithFields, accessToken, async (err, body, res) => {
    if (err) {
      logger.error('Failed to fetch user profile', { 
        error: err.message,
        statusCode: err.statusCode
      });
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      const profile = parseProfile(body);
      
      // If email scope is granted, fetch email separately
      if (this._oauth2._scope && this._oauth2._scope.includes('email')) {
        try {
          const emailResponse = await new Promise((resolve, reject) => {
            this._oauth2.get('https://api.twitter.com/2/users/me?user.fields=email', accessToken, (err, body) => {
              if (err) reject(err);
              else resolve(body);
            });
          });
          
          const emailData = JSON.parse(emailResponse);
          if (emailData.data && emailData.data.email) {
            profile.email = emailData.data.email;
          }
        } catch (emailErr) {
          logger.warn('Failed to fetch email', { error: emailErr.message });
          // Don't fail the whole profile fetch if email fails
        }
      }
      
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
