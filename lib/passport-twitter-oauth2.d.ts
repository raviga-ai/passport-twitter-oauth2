declare module 'passport-twitter-oauth2-ravigaai' {
  import { Strategy as PassportStrategy } from 'passport';
  import { Request } from 'express';

  export interface TwitterProfile {
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
    passReqToCallback?: false;
  }

  export interface StrategyOptionsWithRequest extends Omit<StrategyOptions, 'passReqToCallback'> {
    passReqToCallback: true;
  }

  export type VerifyCallback = (
    err?: Error | null,
    user?: object,
    info?: object
  ) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: TwitterProfile,
    verified: VerifyCallback
  ) => void | Promise<void>;

  export type VerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: TwitterProfile,
    verified: VerifyCallback
  ) => void | Promise<void>;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(options: StrategyOptionsWithRequest, verify: VerifyFunctionWithRequest);
  }

  // Default export
  export default Strategy;
} 