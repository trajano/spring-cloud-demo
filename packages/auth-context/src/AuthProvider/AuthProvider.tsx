import React, { PropsWithChildren, ReactElement, useMemo, useReducer, useRef, useState } from "react";
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
import { useUpdateStatesEffect } from './useUpdateStatesEffect';

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
  const [lastAuthEvents, pushAuthEvent] = useLastAuthEvents(logAuthEventFilterPredicate, logAuthEventSize);
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

  const [authState, setAuthStateAndNotify] = useReducer(
    function reduceAuthStateAndNotify(prev: AuthState, { next, event }: { next: AuthState, event: AuthEvent }): AuthState {
      notify(event);
      if (prev === next) {
        return prev;
      } else {
        return next;
      }
    },
    AuthState.INITIAL);

  const { tokenRefreshable, netInfoState } = useRenderOnTokenEvent(endpointConfiguration);

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
    pushAuthEvent(event);
    subscribersRef.current.forEach((fn) => fn(event));
  }

  async function login(authenticationCredentials: A): Promise<Response> {

    try {
      const [nextOauthToken, authenticationResponse] = await authClient.authenticate(authenticationCredentials);
      const nextTokenExpiresAt = await authStorage.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      notify({
        type: "LoggedIn",
        reason: "Logged with credentials",
        authState,
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      setAuthStateAndNotify({
        next: AuthState.AUTHENTICATED,
        event: {
          type: "Authenticated",
          reason: "Login",
          authState,
          accessToken: nextOauthToken.access_token,
          authorization: `Bearer ${nextOauthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt
        }
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
          type: "LoggedOut",
          authState
        }
      })
      notify({
        type: "Unauthenticated",
        authState,
        reason: "Logged out"
      })

    }
  }

  async function refresh() {
    if (refreshingRef.current) {
      notify({
        type: "Refreshing",
        authState,
        reason: "Already in progress"
      });
      return;
    }
    setAuthStateAndNotify({ next: AuthState.REFRESHING, event: { type: "Refreshing", authState, reason: "Requested" } });
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
            authState,
            reason: "No token stored. Normally should not happen here."
          }
        });
      } else if (!tokenRefreshable) {
        // refresh was attempted when the backend is not available.  This may occur when refresh is forced.
        setAuthStateAndNotify({
          next: AuthState.BACKEND_INACCESSIBLE,
          event: {
            type: "TokenExpiration",
            authState,
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
              authState,
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
                authState,
                reason: e.message,
                responseBody: e.responseBody
              }
            });
          } else if (e instanceof AuthenticationClientError && !e.isUnauthorized()) {
            // at this point there is an error but it's not something caused by the user so don't clear off the token
            lastBackendFailureAttemptRef.current = lastCheckTime;
            setAuthStateAndNotify({
              next: AuthState.BACKEND_FAILURE,
              event: {
                type: "TokenExpiration",
                authState,
                reason: e.message,
                responseBody: e.responseBody,
                netInfoState
              }
            });
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

  useUpdateStatesEffect({
    authState,
    lastCheckTime,
    tokenRefreshable,
    authStorage,
    oauthTokenRef,
    tokenExpiresAtRef,
    lastBackendFailureAttemptRef,
    refreshingRef,
    timeBeforeExpirationRefresh,
    setAuthStateAndNotify,
    notify,
    refresh
  });

  return <AuthContext.Provider value={{
    authState,
    authorization,
    accessToken,
    accessTokenExpired,
    accessTokenExpiresOn: tokenExpiresAtRef.current ?? new Date(lastCheckTime),
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
