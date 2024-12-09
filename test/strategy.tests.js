const should = require('should');
const nock = require('nock');
const Strategy = require('../lib/index').Strategy;

// Example Twitter user profile response
const profileExample = {
  data: {
    id: '2244994945',
    name: 'John Doe',
    username: 'johndoe',
  }
};

nock.disableNetConnect();

describe('Twitter OAuth2 Strategy', function () {
  const origin = 'https://api.twitter.com';
  const profilePath = '/2/users/me';

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
        this.scope = nock(origin)
          .get(profilePath)
          .matchHeader('Authorization', 'Bearer test_access_token')
          .reply(200, profileExample);
      });

      afterEach(function () {
        nock.cleanAll();
      });

      it('passes id, username and display name to callback', function (done) {
        const options = {
          clientID: 'test_client_id',
          clientSecret: 'test_client_secret',
          callbackURL: 'http://localhost:3000/auth/twitter/callback',
          scope: ['tweet.read', 'users.read']
        };

        const st = new Strategy(options, function () {});

        st.userProfile('test_access_token', function (err, profile) {
          should.not.exist(err);
          profile.provider.should.eql('twitter');
          profile.id.should.eql('2244994945');
          profile.username.should.eql('johndoe');
          profile.displayName.should.eql('John Doe');
          profile._raw.should.be.type('string');
          profile._json.should.be.type('object');
          done();
        });
      });
    });

    context('when error occurs', function () {
      beforeEach(function () {
        this.scope = nock(origin)
          .get(profilePath)
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
          should.exist(err);
          should.not.exist(profile);
          done();
        });
      });
    });
  });
});
