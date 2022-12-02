import { createContext } from "react";
import { AuthState } from "./AuthState";
import { buildSimpleEndpointConfiguration } from "./buildSimpleEndpointConfiguration";
import type { IAuth } from "./IAuth";

export const AuthContext = createContext<IAuth>({
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  refresh: () => Promise.resolve(),
  setEndpointConfiguration: () => { },
  subscribe: () => { return () => { }; },
  accessToken: null,
  accessTokenExpired: true,
  accessTokenExpiresOn: new Date(0),
  oauthToken: null,
  authorization: null,
  authState: AuthState.INITIAL,
  endpointConfiguration: buildSimpleEndpointConfiguration(new URL("http://undefined")),
  baseUrl: new URL("http://undefined"),
  tokenRefreshable: false,
  lastAuthEvents: []
});
