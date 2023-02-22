import noop from 'lodash/noop';
import { createContext } from 'react';

import { AuthState } from './AuthState';
import type { IAuth } from './IAuth';
import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';

export const AuthContext = createContext<IAuth<any>>({
  loginAsync: () => Promise.reject(new Error()),
  logoutAsync: () => Promise.resolve(),
  refreshAsync: () => Promise.reject(new Error()),
  setEndpointConfiguration: noop,
  subscribe: () => noop,
  signalStart: noop,
  forceCheckAuthStorageAsync: () => Promise.resolve(),
  accessToken: null,
  accessTokenExpired: true,
  tokenExpiresAt: new Date(0),
  appDataLoaded: false,
  oauthToken: null,
  authorization: null,
  authState: AuthState.INITIAL,
  endpointConfiguration: buildSimpleEndpointConfiguration('https://undefined/'),
  baseUrl: 'https://undefined/',
  backendReachable: false,
  lastCheckAt: new Date(),
  initialAuthEvents: [],
});
