import { createContext } from "react";
import { AuthState } from "./AuthState";
import { buildSimpleEndpointConfiguration } from "./buildSimpleEndpointConfiguration";
import type { IAuth } from "./IAuth";

export const AuthContext = createContext<IAuth>({
  loginAsync: () => Promise.reject(),
  logoutAsync: () => Promise.resolve(),
  refreshAsync: () => Promise.reject(),
  setEndpointConfiguration: () => { },
  subscribe: () => { return () => { }; },
  forceCheckAuthStorageAsync: () => Promise.resolve(),
  accessToken: null,
  accessTokenExpired: true,
  accessTokenExpiresOn: new Date(0),
  oauthToken: null,
  authorization: null,
  authState: AuthState.INITIAL,
  endpointConfiguration: buildSimpleEndpointConfiguration(new URL("http://undefined")),
  baseUrl: new URL("http://undefined"),
  backendReachable: false,
  lastCheckOn: new Date(),
  lastAuthEvents: []
});
