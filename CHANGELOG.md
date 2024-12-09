# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-12-09

### Dependencies
- Updated passport-oauth2 to v1.8.0
- Updated peer dependency passport to v0.7.0

## [1.0.0] - 2024-12-09

### Added
- Initial release
- OAuth 2.0 authentication with Twitter
- PKCE support enabled by default
- TypeScript type definitions
- Automatic state parameter handling
- Comprehensive test coverage
- Example implementation
- Support for Twitter API v2 endpoints
- User profile fetching with proper Bearer token authentication

### Security
- PKCE (Proof Key for Code Exchange) enabled by default
- State parameter validation
- Bearer token authentication for API requests

[1.0.1]: https://github.com/raviga/passport-twitter-oauth2/releases/tag/v1.0.1
[1.0.0]: https://github.com/raviga/passport-twitter-oauth2/releases/tag/v1.0.0 