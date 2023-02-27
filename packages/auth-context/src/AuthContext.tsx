import noop from 'lodash/noop';
import { createContext } from 'react';

import { AuthState } from './AuthState';
import type { IAuth } from './IAuth';
import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';

export const AuthContext = createContext<IAuth<any>>({
  accessToken: null,
  accessTokenExpired: true,
  appDataLoaded: false,
  authorization: null,
  authState: AuthState.INITIAL,
  backendReachable: false,
  baseUrl: 'https://undefined/',
  endpointConfiguration: buildSimpleEndpointConfiguration('https://undefined/'),
  forceCheckAuthStorageAsync: () => Promise.resolve(),
  lastCheckAt: new Date(),
  loginAsync: () => Promise.reject(new Error()),
  logoutAsync: () => Promise.resolve(),
  oauthToken: null,
  refreshAsync: () => Promise.reject(new Error()),
  setEndpointConfiguration: noop,
  signalAppDataLoaded: noop,
  signalStart: noop,
  signalTokenProcessed: noop,
  subscribe: () => noop,
  tokenExpiresAt: new Date(0),
});
