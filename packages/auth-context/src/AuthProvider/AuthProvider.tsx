import React, { PropsWithChildren, ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { useDeepState, useDateState } from '@trajano/react-hooks';
import { AuthClient } from "../AuthClient";
import { AuthContext } from "../AuthContext";
import { AuthenticationClientError } from "../AuthenticationClientError";
import type { AuthEvent } from "../AuthEvent";
import { AuthState } from "../AuthState";
import { AuthStore } from "../AuthStore";
import type { EndpointConfiguration } from "../EndpointConfiguration";
import type { IAuth } from "../IAuth";
import type { OAuthToken } from "../OAuthToken";
import { useLastAuthEvents } from '../useLastAuthEvents';
import { isTokenExpired } from "./isTokenExpired";
import { useBackendFailureTimeoutEffect } from "./useBackendFailureTimeoutEffect";
import { useInitialAuthStateEffect } from "./useInitialAuthStateEffect";
import { useNeedsRefreshEffect } from "./useNeedsRefreshEffect";
import { useRefreshCallback } from "./useRefreshCallback";
import { useRenderOnTokenEvent } from './useRenderOnTokenEvent';
import { useTokenExpirationTimeoutEffect } from "./useTokenExpirationTimeoutEffect";

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

/**
 * Auth provider starts at the INITIAL state in that state it will load up all the necessary data from the stores and set the other states up
 * correctly.
 *
 * Only a few things are stored in the state
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

  const { tokenRefreshable, netInfoState } = useRenderOnTokenEvent(endpointConfiguration);

  /**
   * Authentication state.
   */
  const [authState, setAuthState] = useState(AuthState.INITIAL);

  /**
   * OAuth token state.
   */
  const [oauthToken, setOAuthToken] = useDeepState<OAuthToken | null>(null);

  /**
   * Token expires at state.
   */
  const [tokenExpiresAt, setTokenExpiresAt] = useDateState(0);

  const {
    timeoutRef: tokenExpirationTimeoutRef,
  } = useTokenExpirationTimeoutEffect({
    authState,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    notify,
  })

  const { timeoutRef: backendFailureTimeoutRef } = useBackendFailureTimeoutEffect({
    authState,
    setAuthState,
    notify,
    backendFailureTimeout: 60000,
  })


  function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () => subscribersRef.current = subscribersRef.current.filter(
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

  /**
   * Forces the state to pull from auth storage.  Primarily used for testing as the auth storage is not
   * meant to be modified outside this context.
   */
  async function forceCheckAuthStorage() {
    const nextOauthToken = await authStorage.getOAuthToken();
    const nextTokenExpiresAt = await authStorage.getTokenExpiresAt();
    setOAuthToken(nextOauthToken);
    setTokenExpiresAt(nextTokenExpiresAt);
  }

  async function login(authenticationCredentials: A): Promise<Response> {

    try {
      const [nextOauthToken, authenticationResponse] = await authClient.authenticate(authenticationCredentials);
      const nextTokenExpiresAt = await authStorage.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      setOAuthToken(nextOauthToken);
      setTokenExpiresAt(nextTokenExpiresAt);
      setAuthState(AuthState.AUTHENTICATED);
      notify({
        type: "LoggedIn",
        reason: "Logged with credentials",
        authState,
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      notify({
        type: "Authenticated",
        reason: "Login",
        authState,
        accessToken: nextOauthToken.access_token,
        authorization: `Bearer ${nextOauthToken.access_token}`,
        tokenExpiresAt: nextTokenExpiresAt
      })
      return authenticationResponse;
    } catch (e: unknown) {
      if (e instanceof AuthenticationClientError) {
        await authStorage.clear();
        setOAuthToken(null);
        setTokenExpiresAt(0);
      }
      throw e;
    }

  }

  /**
   * This will perform the logout.  Client failures are ignored since there's no point handling it.
   */
  async function logout() {

    try {
      if (!oauthToken) {
        return;
      }
      await authClient.revoke(oauthToken.refresh_token)
    } catch (e: unknown) {
      if (!(e instanceof AuthenticationClientError)) {
        throw e;
      }
    } finally {
      await authStorage.clear();
      setOAuthToken(null);
      setTokenExpiresAt(0);
      setAuthState(AuthState.UNAUTHENTICATED)
      notify({
        type: "LoggedOut",
        authState,

      })
      notify({
        type: "Unauthenticated",
        authState,
        reason: "Logged out"
      })

    }
  }

  const refresh = useRefreshCallback({
    authState,
    setAuthState,
    notify,
    oauthToken,
    authStorage,
    setOAuthToken,
    setTokenExpiresAt,
    authClient,
    netInfoState,
    tokenRefreshable
  })

  useInitialAuthStateEffect({
    authState,
    setAuthState,
    notify,
    setOAuthToken,
    setTokenExpiresAt,
    authStorage,
    timeBeforeExpirationRefresh
  })

  useNeedsRefreshEffect({
    authState,
    setAuthState,
    notify,
    tokenRefreshable,
    refresh,
  })

  const contextValue: IAuth = useMemo(() => ({
    authState,
    authorization: (!isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh) && !!oauthToken) ? `Bearer ${oauthToken?.access_token}` : null,
    accessToken: oauthToken?.access_token ?? null,
    accessTokenExpired: isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh),
    accessTokenExpiresOn: tokenExpiresAt ?? new Date(0),
    baseUrl,
    oauthToken,
    lastCheckOn: new Date(),
    tokenRefreshable,
    lastAuthEvents,
    endpointConfiguration,
    forceCheckAuthStorage,
    setEndpointConfiguration,
    subscribe,
    login,
    logout,
    refresh
  }), [
    authState,
    baseUrl,
    oauthToken,
    tokenRefreshable,
    lastAuthEvents,
    tokenExpiresAt.getTime(),
    endpointConfiguration,
    tokenExpirationTimeoutRef,
    backendFailureTimeoutRef
  ])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
