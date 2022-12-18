import { isBefore, sub, addMilliseconds, subMilliseconds } from "date-fns";
import React, { PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AuthClient } from "./AuthClient";
import { AuthContext } from "./AuthContext";
import { AuthenticationClientError } from "./AuthenticationClientError";
import type { AuthEvent } from "./AuthEvent";
import { AuthState } from "./AuthState";
import { AuthStore } from "./AuthStore";
import type { EndpointConfiguration } from "./EndpointConfiguration";
import type { OAuthToken } from "./OAuthToken";
import { useLastAuthEvents } from './useLastAuthEvents';
import { useRenderOnTokenEvent } from './useRenderOnTokenEvent';

type AuthContextProviderProps = PropsWithChildren<{
  /**
   * Default endpoint configuration
   */
  defaultEndpointConfiguration: EndpointConfiguration
  /**
   * AsyncStorage prefix used to store the authentication data.
   */
  storagePrefix?: string,
  /**
   * Time in milliseconds to consider refreshing the access token.  Defaults to 10 seconds.
   */
  timeBeforeExpirationRefresh?: number
  /**
   * Predicate to determine whether to log the event.  Defaults to accept all except `Connection` and `CheckRefresh` which are polling events.
   */
  logAuthEventFilterPredicate?: (event: AuthEvent) => boolean;
  /**
   * Size of the auth event log.  Defaults to 50
   */
  logAuthEventSize?: number;
}>;

export type TokenState = {
  oauthToken: OAuthToken | null,
  tokenExpiresAt: Date | null
}
export function AuthProvider<A = any>({
  defaultEndpointConfiguration,
  children,
  logAuthEventFilterPredicate = (event: AuthEvent) => event.type !== "Connection" && event.type !== "CheckRefresh",
  logAuthEventSize = 50,
  timeBeforeExpirationRefresh = 10000,
  storagePrefix = "auth"
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
  const [endpointConfiguration, setEndpointConfiguration] = useState(defaultEndpointConfiguration);
  const authClient = useMemo(() => new AuthClient<A>(endpointConfiguration), [endpointConfiguration]);
  const baseUrl = useMemo(
    () => {
      if (__DEV__) {
        if (endpointConfiguration.baseUrl.substring(endpointConfiguration.baseUrl.length - 1) !== '/') {
          throw new Error(`base URL ${endpointConfiguration.baseUrl} should end with a '/'`)
        }
      }
      return new URL(endpointConfiguration.baseUrl);
    },
    [endpointConfiguration.baseUrl]
  );
  const authStorage = useMemo(() => new AuthStore(storagePrefix, endpointConfiguration.baseUrl), [endpointConfiguration.baseUrl]);

  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);

  const [authState, setAuthState] = useState(AuthState.INITIAL);
  const [tokenState, setTokenState] = useState<TokenState>({
    oauthToken: null,
    tokenExpiresAt: null
  });

  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(logAuthEventFilterPredicate, logAuthEventSize);
  const { lastCheckTime, tokenRefreshable, netInfoState } = useRenderOnTokenEvent(endpointConfiguration, tokenState.tokenExpiresAt, timeBeforeExpirationRefresh, authState);

  // what I want is a hook that will rerender this component when specific dispatch events occur
  // the dispatch events are app state changes, network state changes, token expiration

  const accessToken = tokenState.oauthToken?.access_token ?? null;

  // const accessTokenExpired = (!tokenState.oauthToken || !tokenState.tokenExpiresAt) || !isBefore(Date.now(), subMilliseconds(tokenState.tokenExpiresAt, timeBeforeExpirationRefresh));

  const [accessTokenExpired, setAccessTokenExpired] = useState<boolean | null>(true);
  useEffect(() => {
    authStorage.isExpiringInSeconds(timeBeforeExpirationRefresh)
    if (!tokenState.oauthToken || !tokenState.tokenExpiresAt) {
      setAccessTokenExpired(true);
    } else {
      setAccessTokenExpired(!isBefore(Date.now(), subMilliseconds(tokenState.tokenExpiresAt, timeBeforeExpirationRefresh)));
    }
  }, [tokenState.oauthToken, tokenState.tokenExpiresAt, lastCheckTime])
  // const accessTokenExpired = useMemo(
  //   () => {
  //     console.log([tokenState.oauthToken, tokenState.tokenExpiresAt, lastCheckTime, !isBefore(Date.now(), subMilliseconds(tokenState.tokenExpiresAt, timeBeforeExpirationRefresh))])
  //     if (!tokenState.oauthToken || !tokenState.tokenExpiresAt) {
  //       return true;
  //     } else {
  //       return !isBefore(Date.now(), subMilliseconds(tokenState.tokenExpiresAt, timeBeforeExpirationRefresh));
  //     }
  //   },
  //   [tokenState.oauthToken, tokenState.tokenExpiresAt, lastCheckTime]);
  const authorization = useMemo(() => (!accessTokenExpired && tokenState.oauthToken) ? `Bearer ${tokenState.oauthToken.access_token}` : null, [tokenState.oauthToken, accessTokenExpired]);

  const subscribe = useCallback(function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () => subscribersRef.current.filter(
      (subscription) => !Object.is(subscription, fn));
  }, []);


  useEffect(() => {
    notify({ type: 'CheckRefresh', reason: `Triggered by a change to tokenRefreshable=${tokenRefreshable} accessTokenExpired: ${accessTokenExpired} lastCheckTime: ${new Date(lastCheckTime).toISOString()}` })
    if (accessTokenExpired === null) {
      // do nothing as the access token is not yet initialized
      return;
    }

    if (false && !accessTokenExpired && tokenState.oauthToken !== null && authState === AuthState.INITIAL) {
      setAuthState(AuthState.NEEDS_REFRESH);
    }
    // there's no oauth token to refresh and AuthState !== UNAUTHENTICATED
    else if (tokenState.oauthToken === null && authState !== AuthState.UNAUTHENTICATED && authState !== AuthState.INITIAL) {
      setAuthState(AuthState.UNAUTHENTICATED);
      notify({ type: "Unauthenticated", reason: `there's no oauth token to refresh and authState ${AuthState[authState]} !== UNAUTHENTICATED` });
    } else if (tokenRefreshable && accessTokenExpired && tokenState.oauthToken !== null) {
      // there's a state change determine if we need to refresh.
      setAuthState(AuthState.NEEDS_REFRESH);
    } else if (!tokenRefreshable && accessTokenExpired && tokenState.oauthToken !== null) {
      setAuthState(AuthState.BACKEND_INACCESSIBLE);
    }
  }, [tokenRefreshable, accessTokenExpired, lastCheckTime]);


  useEffect(() => {
    // there's a state change determine if we need to refresh.
    (async () => {
      notify({ type: 'CheckRefresh', reason: `Triggered by a change to tokenRefreshable=${tokenRefreshable} authState: ${AuthState[authState]}` })
      if (accessTokenExpired === null) {
        // don't do anything yet
        return;
      }
      if (false && authState === AuthState.INITIAL && !(await authStorage.isExpired())) {
        setAuthState(AuthState.AUTHENTICATED)
        notify({
          type: 'Authenticated',
          reason: `From stored token`,
          accessToken: accessToken!,
          authorization: authorization!,
          tokenExpiresAt: await authStorage.getTokenExpiresAt()
        });

      }
      else if (tokenRefreshable &&
        (authState === AuthState.NEEDS_REFRESH ||
          authState === AuthState.INITIAL)
      ) {
        notify({
          type: 'TokenExpiration',
          reason: `Token is refreshable and auth state=${AuthState[authState]}`,
        });
        await refresh();
      }
    })();
  }, [tokenRefreshable, authState]);
  /**
   * Notifies subscribers.  There's a specific handler if it is "Unauthenticated" that the provider handles.
   */
  function notify(event: AuthEvent) {
    // apply auth state if available.
    event.authState = authState;
    pushAuthEvent(event);
    subscribersRef.current.forEach((fn) => fn(event));
  }


  async function login(authenticationCredentials: A): Promise<Response> {

    try {
      const [nextOauthToken, authenticationResponse] = await authClient.authenticate(authenticationCredentials);
      const nextTokenExpiresAt = await authStorage.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      setAuthState(AuthState.AUTHENTICATED);
      setTokenState({
        oauthToken: nextOauthToken,
        tokenExpiresAt: nextTokenExpiresAt
      })
      notify({
        type: "LoggedIn",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      notify({
        type: "Authenticated",
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      return authenticationResponse;
    } catch (e: unknown) {
      if (e instanceof AuthenticationClientError) {
        await authStorage.clear();
      }
      throw e;
    }

  }

  /**
   * This will perform the logout.  Client failures are ignored since there's no point handling it.
   */
  async function logout() {

    try {
      if (tokenState.oauthToken == null) {
        return;
      }
      await authClient.revoke(tokenState.oauthToken.refresh_token)
    } catch (e: unknown) {
      if (!(e instanceof AuthenticationClientError)) {
        throw e;
      }
    } finally {
      await authStorage.clear();
      setAuthState(AuthState.UNAUTHENTICATED);
      setTokenState({
        oauthToken: null,
        tokenExpiresAt: new Date(0)
      });
      notify({
        type: "LoggedOut"
      })
      notify({
        type: "Unauthenticated",
        reason: "Logged out"
      })

    }
  }

  async function refresh() {
    const storedOAuthToken = await authStorage.getOAuthToken();
    if (storedOAuthToken == null) {
      setAuthState(AuthState.UNAUTHENTICATED);
      setTokenState({
        oauthToken: null,
        tokenExpiresAt: new Date(0)
      });
      notify({
        type: "Unauthenticated",
        reason: "No token stored"
      })
    } else if (!tokenRefreshable) {
      setAuthState(AuthState.BACKEND_INACCESSIBLE);
      // refresh was attempted when the backend is not available
      notify({
        type: "TokenExpiration",
        reason: "Backend is not available and token refresh was requested",
        netInfoState
      })
    } else {
      setAuthState(AuthState.REFRESHING);
      notify({
        type: "Refreshing",
      })
      try {
        const refreshedOAuthToken = await authClient.refresh(storedOAuthToken.refresh_token);
        const nextTokenExpiresAt = await authStorage.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
        setAuthState(AuthState.AUTHENTICATED);
        setTokenState({
          oauthToken: refreshedOAuthToken,
          tokenExpiresAt: nextTokenExpiresAt
        })
        notify({
          type: "Authenticated",
          reason: "Refreshed",
          accessToken: refreshedOAuthToken.access_token,
          authorization: `Bearer ${refreshedOAuthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt
        })
      } catch (e: unknown) {
        if (e instanceof AuthenticationClientError && e.isUnauthorized()) {
          await authStorage.clear();
          setAuthState(AuthState.UNAUTHENTICATED);
          setTokenState({
            oauthToken: null,
            tokenExpiresAt: new Date(0)
          });
          notify({
            type: "Unauthenticated",
            reason: e.message,
            responseBody: await e.response.json()
          })
        } else if (e instanceof AuthenticationClientError && !e.isUnauthorized()) {
          // at this point there is an error but it's not something caused by the user so don't clear off the token
          setAuthState(AuthState.BACKEND_FAILURE);
          notify({
            type: "TokenExpiration",
            reason: e.message,
            responseBody: await e.response.json(),
            netInfoState
          })
        } else {
          throw e;
        }
      }
    }
  }


  return <AuthContext.Provider value={{
    authState,
    authorization,
    accessToken,
    accessTokenExpired,
    accessTokenExpiresOn: tokenState.tokenExpiresAt || new Date(0),
    baseUrl,
    oauthToken: tokenState.oauthToken,
    tokenRefreshable,
    lastAuthEvents,
    endpointConfiguration,
    setEndpointConfiguration,
    subscribe,
    login,
    logout,
    refresh
  }}>{children}</AuthContext.Provider>
}
