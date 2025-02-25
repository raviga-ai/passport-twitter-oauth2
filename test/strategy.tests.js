const should = require('should');
const nock = require('nock');
const Strategy = require('../lib/index').Strategy;

// Example Twitter user profile response
const profileExample = {
  data: {
    id: '2244994945',
    name: 'John Doe',
    username: 'johndoe',
    description: 'Test bio',
    location: 'San Francisco, CA',
    profile_image_url: 'https://example.com/image.jpg',
    verified: true,
    verified_type: 'blue',
    protected: false,
    public_metrics: {
      followers_count: 1000,
      following_count: 500
    },
    url: 'https://example.com'
  }
};

nock.disableNetConnect();

describe('Twitter OAuth2 Strategy', function () {
  this.timeout(5000); // Increase timeout to 5 seconds
  
  const origin = 'https://api.twitter.com';
  const profilePath = '/2/users/me';
  const defaultFields = 'description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type,withheld';

  it('sanity check', function (done) {
    const options = {
      clientID: 'test_client_id',
      clientSecret: 'test_client_secret',
      callbackURL: 'http://localhost:3000/auth/twitter/callback',
      scope: ['tweet.read', 'users.read']
    };
    const st = new Strategy(options, function () {});

    st.name.should.eql('twitter');
    st.profileUrl.should.eql(`${origin}${profilePath}`);

    done();
  });

  describe('userProfile(accessToken, done)', function () {
    context('with user.read scope', function () {
      beforeEach(function () {
        nock(origin)
          .get(`${profilePath}?user.fields=${defaultFields}`)
          .matchHeader('Authorization', 'Bearer test_access_token')
          .reply(200, profileExample);
      });

      afterEach(function () {
        nock.cleanAll();
      });

      it('passes profile data to callback', function (done) {
        const options = {
          clientID: 'test_client_id',
          clientSecret: 'test_client_secret',
          callbackURL: 'http://localhost:3000/auth/twitter/callback',
          scope: ['tweet.read', 'users.read']
        };

        const st = new Strategy(options, function () {});

        st.userProfile('test_access_token', function (err, profile) {
          if (err) return done(err);
          
          try {
            should.not.exist(err);
            profile.provider.should.eql('twitter');
            profile.id.should.eql('2244994945');
            profile.username.should.eql('johndoe');
            profile.displayName.should.eql('John Doe');
            profile.description.should.eql('Test bio');
            profile.location.should.eql('San Francisco, CA');
            profile.photos[0].value.should.eql('https://example.com/image.jpg');
            profile.verified.should.eql(true);
            profile.verifiedType.should.eql('blue');
            profile.protected.should.eql(false);
            profile.metrics.should.be.type('object');
            profile.url.should.eql('https://example.com');
            profile._raw.should.be.type('string');
            profile._json.should.be.type('object');
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });

    context('when error occurs', function () {
      beforeEach(function () {
        nock(origin)
          .get(`${profilePath}?user.fields=${defaultFields}`)
          .matchHeader('Authorization', 'Bearer test_access_token')
          .reply(500, {
            errors: [{ message: 'Internal Server Error' }]
          });
      });

      afterEach(function () {
        nock.cleanAll();
      });

      it('passes error to callback', function (done) {
        const options = {
          clientID: 'test_client_id',
          clientSecret: 'test_client_secret',
          callbackURL: 'http://localhost:3000/auth/twitter/callback',
          scope: ['tweet.read', 'users.read']
        };

        const st = new Strategy(options, function () {});

        st.userProfile('test_access_token', function (err, profile) {
          try {
            should.exist(err);
            should.not.exist(profile);
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });
});
