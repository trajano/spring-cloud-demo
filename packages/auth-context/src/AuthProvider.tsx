import { useDeepState } from "@trajano/react-hooks";
import { isAfter } from "date-fns";
import React, { PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
   * Time in seconds to consider refreshing the access token.  Defaults to 10.
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
  tokenExpiresAt: Date
}
export function AuthProvider<A = any>({
  defaultEndpointConfiguration,
  children,
  logAuthEventFilterPredicate = (event: AuthEvent) => event.type !== "Connection" && event.type !== "CheckRefresh",
  logAuthEventSize = 50,
  timeBeforeExpirationRefresh = 10,
  storagePrefix = "auth"
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
  const [endpointConfiguration, setEndpointConfiguration] = useState(defaultEndpointConfiguration);
  const authClient = useMemo(() => new AuthClient<A>(endpointConfiguration), [endpointConfiguration]);
  const baseUrl = useMemo(() => new URL(endpointConfiguration.baseUrl), [endpointConfiguration.baseUrl]);
  const authStorage = useMemo(() => new AuthStore(storagePrefix, endpointConfiguration.baseUrl), [endpointConfiguration.baseUrl]);

  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);

  const [authState, setAuthState] = useState(AuthState.INITIAL);
  const [tokenState, setTokenState] = useDeepState<TokenState>({
    oauthToken: null,
    tokenExpiresAt: new Date(0)
  });

  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(logAuthEventFilterPredicate, logAuthEventSize);

  // what I want is a hook that will rerender this component when specific dispatch events occur
  // the dispatch events are app state changes, network state changes, token expiration

  const accessToken = useMemo(() => tokenState.oauthToken?.access_token ?? null, [tokenState.oauthToken]);
  const { lastCheckTime, tokenRefreshable } = useRenderOnTokenEvent(endpointConfiguration, tokenState.tokenExpiresAt, timeBeforeExpirationRefresh);

  const accessTokenExpired = useMemo(
    () => {
      if (!tokenState.oauthToken) {
        return true;
      } else {
        return isAfter(Date.now(), tokenState.tokenExpiresAt);
      }
    },
    [tokenState.oauthToken, tokenState.tokenExpiresAt, lastCheckTime]);
  const authorization = useMemo(() => (!accessTokenExpired && tokenState.oauthToken) ? `Bearer ${tokenState.oauthToken.access_token}` : null, [tokenState.oauthToken, accessTokenExpired]);

  const subscribe = useCallback(function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () => subscribersRef.current.filter(
      (subscription) => !Object.is(subscription, fn));
  }, []);

  /**
   * Notifies subscribers.  There's a specific handler if it is "Unauthenticated" that the provider handles.
   */
  const notify = useCallback(function notify(event: AuthEvent) {
    pushAuthEvent(event);
    subscribersRef.current.forEach((fn) => fn(event));
  }, []);

  useEffect(() => {
    // there's a state change determine if we need to refresh.
    (async () => {
      notify({ type: 'CheckRefresh', reason: `Triggered by a change to ${JSON.stringify({ tokenRefreshable, authState })}` })
      if (tokenRefreshable &&
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

  useEffect(() => {
    notify({ type: 'CheckRefresh', reason: `Triggered by a change to ${JSON.stringify({ tokenRefreshable, accessTokenExpired, lastCheckTime })}` })
    // there's a state change determine if we need to refresh.
    if (tokenRefreshable && accessTokenExpired) {
      setAuthState(AuthState.NEEDS_REFRESH);
    } else if (!tokenRefreshable && accessTokenExpired) {
      setAuthState(AuthState.BACKEND_FAILURE);
    }
  }, [tokenRefreshable, accessTokenExpired, lastCheckTime]);

  async function login(authenticationCredentials: A): Promise<void> {

    try {
      const nextOauthToken = await authClient.authenticate(authenticationCredentials);
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
    setAuthState(AuthState.REFRESHING);
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
      setAuthState(AuthState.BACKEND_FAILURE);
      // refresh was attempted when the backend is not available
      notify({
        type: "TokenExpiration",
        reason: "Backend is not available and token refresh was requested"
      })
    } else {
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
            responseBody: await e.response.json()
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
    accessTokenExpiresOn: tokenState.tokenExpiresAt,
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
