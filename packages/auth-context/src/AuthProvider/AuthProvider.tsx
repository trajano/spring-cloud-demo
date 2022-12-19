import React, { PropsWithChildren, ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { AuthClient } from "../AuthClient";
import { AuthContext } from "../AuthContext";
import { AuthenticationClientError } from "../AuthenticationClientError";
import type { AuthEvent } from "../AuthEvent";
import { AuthState } from "../AuthState";
import { AuthStore } from "../AuthStore";
import type { EndpointConfiguration } from "../EndpointConfiguration";
import type { OAuthToken } from "../OAuthToken";
import { useLastAuthEvents } from '../useLastAuthEvents';
import { useRenderOnTokenEvent } from '../useRenderOnTokenEvent';
import { useTokenCheckClock } from "../useTokenCheckClock";
import { isTokenRefExpired } from "./isTokenRefExpired";
import { updateTokenInfoRef } from "./updateTokenInfoRef";
import { useInitialAuthStateEffect } from "./useInitialAuthStateEffect";

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

/**
 * Auth provider starts at the INITIAL state in that state it will load up all the necessary data from the stores and set the other states up
 * correctly.
 * @param param0
 * @returns
 */
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
      /* istanbul ignore next */
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

  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(logAuthEventFilterPredicate, logAuthEventSize);
  const { tokenRefreshable, netInfoState } = useRenderOnTokenEvent(endpointConfiguration, null, 0, authState);

  /**
   * Indicates that refresh is active
   */
  const refreshingRef = useRef(authState === AuthState.REFRESHING);


  // OAuth token reference, this is updated by some effect
  const oauthTokenRef = useRef<OAuthToken | null>(null);

  // Token expires reference, this is updated by some effect
  const tokenExpiresAtRef = useRef<Date | null>(null);

  const { lastCheckTime } = useTokenCheckClock(
    authState,
    tokenExpiresAtRef.current,
    timeBeforeExpirationRefresh
  );

  /**
   * When the last backend failure attempt as done. Prevents effect infinite loops.
   */
  const lastBackendFailureAttemptRef = useRef(lastCheckTime);

  const accessToken = useMemo(() => oauthTokenRef.current?.access_token ?? null, [lastCheckTime, oauthTokenRef.current?.access_token]);
  const accessTokenExpired = useMemo(() => isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh), [lastCheckTime, tokenExpiresAtRef.current, timeBeforeExpirationRefresh]);
  const authorization = useMemo(() => (!accessTokenExpired && !!oauthTokenRef.current) ? `Bearer ${accessToken}` : null, [lastCheckTime, accessTokenExpired, oauthTokenRef.current]);

  /**
   * This will be changed to reducer later to ensure notifications occur for every state change.
   */
  function setAuthStateAndNotify({ next, event }: { next: AuthState, event: AuthEvent }): void {
    setAuthState(next);
    notify(event);
  }

  function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () => subscribersRef.current.filter(
      (subscription) => !Object.is(subscription, fn));
  }

  /**
   * Notifies subscribers.  There's a specific handler if it is "Unauthenticated" that the provider handles.
   * These and other functions are not wrapped in useCallback because when any of the state changes it
   * will render these anyway and we're not optimizing from the return value either.
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
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      setAuthState(AuthState.AUTHENTICATED);

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
        await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      }
      throw e;
    }

  }

  /**
   * This will perform the logout.  Client failures are ignored since there's no point handling it.
   */
  async function logout() {

    try {
      if (!oauthTokenRef.current) {
        return;
      }
      await authClient.revoke(oauthTokenRef.current.refresh_token)
    } catch (e: unknown) {
      if (!(e instanceof AuthenticationClientError)) {
        throw e;
      }
    } finally {
      await authStorage.clear();
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      setAuthStateAndNotify({
        next: AuthState.UNAUTHENTICATED, event: {
          type: "LoggedOut"
        }
      })
      notify({
        type: "Unauthenticated",
        reason: "Logged out"
      })

    }
  }

  async function refresh() {
    if (refreshingRef.current) {
      notify({ type: "Refreshing", reason: "Already in progress" });
      return;
    }
    setAuthStateAndNotify({ next: AuthState.REFRESHING, event: { type: "Refreshing", reason: "Requested" } });
    refreshingRef.current = true;
    try {
      const storedOAuthToken = await authStorage.getOAuthToken();
      if (storedOAuthToken == null) {
        // No token stored. Normally should not happen hear unless the token was removed from storage by
        // some means other than the API.
        setAuthStateAndNotify({
          next: AuthState.UNAUTHENTICATED,
          event: {
            type: "Unauthenticated",
            reason: "No token stored. Normally should not happen here."
          }
        });
      } else if (!tokenRefreshable) {
        // refresh was attempted when the backend is not available.  This may occur when refresh is forced.
        setAuthStateAndNotify({
          next: AuthState.BACKEND_INACCESSIBLE,
          event: {
            type: "TokenExpiration",
            reason: "Backend is not available and token refresh was requested",
            netInfoState
          }
        });
      } else {
        try {
          const refreshedOAuthToken = await authClient.refresh(storedOAuthToken.refresh_token);
          const nextTokenExpiresAt = await authStorage.storeOAuthTokenAndGetExpiresAt(refreshedOAuthToken)
          await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
          setAuthStateAndNotify({
            next: AuthState.AUTHENTICATED,
            event: {
              type: "Authenticated",
              reason: "Refreshed",
              accessToken: refreshedOAuthToken.access_token,
              authorization: `Bearer ${refreshedOAuthToken.access_token}`,
              tokenExpiresAt: nextTokenExpiresAt
            }
          });
        } catch (e: unknown) {
          if (e instanceof AuthenticationClientError && e.isUnauthorized()) {
            await authStorage.clear();
            await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
            setAuthStateAndNotify({
              next: AuthState.UNAUTHENTICATED,
              event: {
                type: "Unauthenticated",
                reason: e.message,
                responseBody: e.responseBody
              }
            });
          } else if (e instanceof AuthenticationClientError && !e.isUnauthorized()) {
            // at this point there is an error but it's not something caused by the user so don't clear off the token
            setAuthStateAndNotify({
              next: AuthState.BACKEND_FAILURE,
              event: {
                type: "TokenExpiration",
                reason: e.message,
                responseBody: e.responseBody,
                netInfoState
              }
            });
            lastBackendFailureAttemptRef.current = lastCheckTime;
          } else {
            throw e;
          }
        }
      }
    } finally {
      refreshingRef.current = false;
    }
  }


  useInitialAuthStateEffect({
    setAuthStateAndNotify,
    authStorage,
    oauthTokenRef,
    tokenExpiresAtRef,
    timeBeforeExpirationRefresh
  });

  useEffect(() => {
    async function updateStatesAfterRender() {
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      if (authState === AuthState.INITIAL || authState === AuthState.UNAUTHENTICATED || authState === AuthState.REFRESHING || !!refreshingRef.current) {
        // no op
      } else if (authState === AuthState.AUTHENTICATED && !isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)) {
        // no op
      } else if (authState === AuthState.NEEDS_REFRESH && tokenRefreshable && refreshingRef.current) {
        // no op
      } else if (authState === AuthState.BACKEND_FAILURE && lastBackendFailureAttemptRef.current === lastCheckTime) {
        // no op
      } else if (authState === AuthState.NEEDS_REFRESH && lastBackendFailureAttemptRef.current === lastCheckTime) {
        // no op
      } else if (authState === AuthState.BACKEND_INACCESSIBLE && !tokenRefreshable) {
        // no op
      } else if (authState === AuthState.BACKEND_INACCESSIBLE && lastBackendFailureAttemptRef.current === lastCheckTime) {
        // no op
      } else if (authState === AuthState.BACKEND_INACCESSIBLE && tokenRefreshable) {
        // clear off attempt
        lastBackendFailureAttemptRef.current = 0;
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: { type: "TokenExpiration", reason: "Needs refresh, backend was inaccessible is now accessible" }
        })
      } else if (authState === AuthState.BACKEND_FAILURE && lastBackendFailureAttemptRef.current !== lastCheckTime && !refreshingRef.current) {
        notify({ type: "CheckRefresh", reason: "Needs refresh from backend failure and not refreshing" })
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: { type: "TokenExpiration", reason: "Needs refresh from backend failure" }
        })
      } else if (authState === AuthState.NEEDS_REFRESH && tokenRefreshable && !refreshingRef.current) {
        notify({ type: "CheckRefresh", reason: "Needs refresh and token is refreshable and not refreshing" })
        await refresh();
      } else if (authState === AuthState.NEEDS_REFRESH && !tokenRefreshable) {
        // use zero because there's still that grace time
        setAuthStateAndNotify({
          next: AuthState.BACKEND_INACCESSIBLE,
          event: {
            type: "TokenExpiration",
            reason: `Token has expired at ${tokenExpiresAtRef.current?.toISOString()} but backend is not accessible`
          }
        })
        lastBackendFailureAttemptRef.current = lastCheckTime;
      } else if (authState === AuthState.AUTHENTICATED && isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh)) {
        setAuthStateAndNotify({
          next: AuthState.NEEDS_REFRESH,
          event: {
            type: "TokenExpiration",
            reason: `Token has expired at ${tokenExpiresAtRef.current?.toISOString()} and needs refresh`
          }
        })
      } else {
        /* istanbul ignore next */
        console.warn(`Unexpected state = ${JSON.stringify({ lastCheckTime: new Date(lastCheckTime).toISOString(), authState: AuthState[authState], tokenRefreshable, oauthTokenRef, tokenExpiresAtRef })}`);
      }
    }
    if (authState !== AuthState.INITIAL) {
      notify({
        type: "CheckRefresh",
        reason: `Update in lastCheckTime: ${new Date(lastCheckTime).toISOString()} authState: ${AuthState[authState]} tokenRefreshable: ${tokenRefreshable} tokenExpiresAt: ${JSON.stringify(tokenExpiresAtRef)} (${isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh) ? "expired" : "not expired"})`,
      })
      // console.log({
      //   lastCheckTime: new Date(lastCheckTime).toISOString(),
      //   reason: `Update in authState: ${AuthState[authState]} tokenRefreshable: ${tokenRefreshable} tokenExpiresAt: ${JSON.stringify(tokenExpiresAtRef)} (${isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh) ? "expired" : "not expired"})`,
      //   lastBackendFailureAttemptRef: new Date(lastBackendFailureAttemptRef.current),
      //   now: new Date().toISOString()
      // })
      updateStatesAfterRender();
    }
  }, [lastCheckTime, authState, tokenRefreshable])

  return <AuthContext.Provider value={{
    authState,
    authorization,
    accessToken,
    accessTokenExpired,
    accessTokenExpiresOn: tokenExpiresAtRef.current || new Date(0),
    baseUrl,
    oauthToken: oauthTokenRef.current,
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
