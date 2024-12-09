declare module 'passport-twitter-oauth2' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface Profile {
    provider: 'twitter';
    id: string;
    username: string;
    displayName: string;
    _raw: string;
    _json: {
      data: {
        id: string;
        name: string;
        username: string;
        [key: string]: any;
      }
    };
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    state?: boolean;
    pkce?: boolean;
    passReqToCallback?: boolean;
  }

  export interface StrategyOptionsWithRequest extends StrategyOptions {
    passReqToCallback: true;
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export type VerifyFunctionWithRequest = (
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(options: StrategyOptionsWithRequest, verify: VerifyFunctionWithRequest);
  }
} 