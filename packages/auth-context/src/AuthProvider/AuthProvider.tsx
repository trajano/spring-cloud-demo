import React, { PropsWithChildren, ReactElement, useMemo, useRef, useState } from "react";
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
import { isTokenRefExpired } from "./isTokenRefExpired";
import { updateTokenInfoRef } from "./updateTokenInfoRef";
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

export type TokenState = {
  oauthToken: OAuthToken | null,
  tokenExpiresAt: Date | null
}

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


  // OAuth token reference, this is updated by some effect
  const oauthTokenRef = useRef<OAuthToken | null>(null);

  // Token expires reference, this is updated by some effect
  const tokenExpiresAtRef = useRef<Date | null>(null);

  const {
    timeoutRef: tokenExpirationTimeoutRef,
    lastCheckAt: lastCheckOn,
    nextCheckAt: nextCheckOn
  } = useTokenExpirationTimeoutEffect({
    authState,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh,
    tokenExpiresAt: tokenExpiresAtRef.current,
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

  /**
   * Sets the auth state and performs a notification.  Since the notification triggers a state change using
   * pushAuthEvent, it cannot be placed as a reducer function.
   */
  function setAuthStateAndNotify({ next, event }: { next: AuthState, event: AuthEvent | AuthEvent[] }): void {

    setAuthState(next);
    if (Array.isArray(event)) {
      event.forEach(notify);
    } else {
      notify(event);
    }

  }

  async function login(authenticationCredentials: A): Promise<Response> {

    try {
      const [nextOauthToken, authenticationResponse] = await authClient.authenticate(authenticationCredentials);
      const nextTokenExpiresAt = await authStorage.storeOAuthTokenAndGetExpiresAt(nextOauthToken);
      await updateTokenInfoRef(authStorage, oauthTokenRef, tokenExpiresAtRef);
      setAuthStateAndNotify({
        next: AuthState.AUTHENTICATED,
        event: [{
          type: "LoggedIn",
          reason: "Logged with credentials",
          authState,
          accessToken: nextOauthToken.access_token,
          authorization: `Bearer ${nextOauthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt
        }, {
          type: "Authenticated",
          reason: "Login",
          authState,
          accessToken: nextOauthToken.access_token,
          authorization: `Bearer ${nextOauthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt
        }]
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
          authState,
        }
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
    authStorage,
    oauthTokenRef,
    tokenExpiresAtRef,
    authClient,
    netInfoState,
    tokenRefreshable
  })

  useInitialAuthStateEffect({
    authState,
    setAuthState,
    notify,
    authStorage,
    oauthTokenRef,
    tokenExpiresAtRef,
    timeBeforeExpirationRefresh
  })

  useNeedsRefreshEffect({
    authState,
    setAuthState,
    notify,
    tokenRefreshable,
    refresh,
  })

  const accessToken = useMemo(() => oauthTokenRef.current?.access_token ?? null, [
    tokenExpirationTimeoutRef.current,
    backendFailureTimeoutRef.current,
    oauthTokenRef.current?.access_token
  ]);
  const accessTokenExpired = useMemo(() => isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh), [
    tokenExpirationTimeoutRef.current,
    backendFailureTimeoutRef.current,
    timeBeforeExpirationRefresh
  ]);
  const authorization = useMemo(() => (!accessTokenExpired && !!oauthTokenRef.current) ? `Bearer ${accessToken}` : null, [accessTokenExpired, accessToken]);
  const accessTokenExpiresOn = useMemo(() => tokenExpiresAtRef.current ?? new Date(0), [tokenExpirationTimeoutRef.current, tokenExpiresAtRef.current])

  const contextValue: IAuth = useMemo(() => ({
    authState,
    authorization,
    accessToken: oauthTokenRef.current?.access_token ?? null,
    accessTokenExpired: isTokenRefExpired(tokenExpiresAtRef, timeBeforeExpirationRefresh),
    accessTokenExpiresOn,
    baseUrl,
    oauthToken: oauthTokenRef.current,
    lastCheckOn,
    nextCheckOn,
    tokenRefreshable,
    lastAuthEvents,
    endpointConfiguration,
    setEndpointConfiguration,
    subscribe,
    login,
    logout,
    refresh
  }), [
    authState,
    baseUrl,
    oauthTokenRef.current,
    lastCheckOn.getTime(),
    nextCheckOn?.getTime,
    tokenRefreshable,
    lastAuthEvents,
    authorization,
    tokenExpiresAtRef.current?.getTime(),
    endpointConfiguration
  ])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
