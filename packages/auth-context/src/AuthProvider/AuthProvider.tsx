import { useDateState, useDeepState, useSignal } from '@trajano/react-hooks';
import React, {
  ReactElement,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { AuthProviderProps } from './AuthProviderProps';
import { isTokenExpired } from './isTokenExpired';
import { useInitialAuthStateEffect } from './useInitialAuthStateEffect';
import { useNoTokenAvailableEffect } from './useNoTokenAvailableEffect';
import { useRenderOnTokenEvent } from './useRenderOnTokenEvent';
import { useTokenAvailableEffect } from './useTokenAvailableEffect';
import { AuthClient } from '../AuthClient';
import { AuthContext } from '../AuthContext';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { AuthStore } from '../AuthStore';
import { AuthenticationClientError } from '../AuthenticationClientError';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import type { IAuth } from '../IAuth';
import type { OAuthToken } from '../OAuthToken';
import { useAppActiveState } from '../useAppActiveState';
import { useBackendReachable } from '../useBackendReachable';
import { validateEndpointConfiguration } from '../validateEndpointConfiguration';

/**
 * Auth provider starts at the INITIAL state in that state it will load up all
 * the necessary data from the stores and set the other states up correctly.
 *
 * Only a few things are stored in the state
 *
 * @param param0
 * @returns
 */
export function AuthProvider<A = unknown>({
  defaultEndpointConfiguration,
  children,
  timeBeforeExpirationRefresh = 10000,
  storagePrefix = 'auth',
  // onRefreshError: inOnRefreshError,
  authStorage: inAuthStorage,
  waitForSignalToStart = false,
  waitForSignalWhenDataIsLoaded = false,
  waitForSignalWhenNewTokenIsProcessed = false,
}: AuthProviderProps): ReactElement<AuthProviderProps> {
  const [endpointConfiguration, setEndpointConfiguration] = useState(
    defaultEndpointConfiguration
  );
  const authClient = useMemo(
    () => new AuthClient<A>(endpointConfiguration),
    [endpointConfiguration]
  );
  const validatedSetEndpointConfiguration = useCallback(
    (nextEndpointConfiguration: EndpointConfiguration) => {
      validateEndpointConfiguration(nextEndpointConfiguration);
      setEndpointConfiguration(nextEndpointConfiguration);
    },
    [setEndpointConfiguration]
  );

  /**
   * Auth storage. If inAuthStorage is provided it will use that otherwise it
   * will create a new one.
   */
  const authStorage = useMemo(
    () =>
      inAuthStorage ??
      new AuthStore(storagePrefix, endpointConfiguration.baseUrl),
    [endpointConfiguration.baseUrl, inAuthStorage, storagePrefix]
  );

  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);

  /** Authentication state. */
  const [authState, setAuthState] = useState(AuthState.INITIAL);

  /** OAuth token state. */
  const [oauthToken, setOAuthToken] = useDeepState<OAuthToken | null>(null);

  /** Token expires at state. */
  const [tokenExpiresAt, setTokenExpiresAt] = useDateState(0);

  /**
   * Signal that the context should start. Unlike the other signals this cannot
   * be reset.
   */
  const [signaled, signalStart] = useReducer(() => true, !waitForSignalToStart);

  /**
   * Notifies subscribers. There's a specific handler if it is "Unauthenticated"
   * that the provider handles. This must only be built once otherwise there
   * will be extra side effects being triggered.
   */
  const notify = useCallback((event: AuthEvent) => {
    subscribersRef.current.forEach((fn) => fn(event));
  }, []);

  /** Application data loaded signal. */
  const [appDataLoaded, signalAppDataLoaded, resetAppDataLoaded] = useSignal(
    !waitForSignalWhenDataIsLoaded
  );
  /** Token processed signal. */
  const [tokenProcessed, signalTokenProcessed, resetTokenProcessed] = useSignal(
    !waitForSignalWhenNewTokenIsProcessed
  );

  useRenderOnTokenEvent({
    endpointConfiguration,
  });

  const subscribe = useCallback((fn: (event: AuthEvent) => void) => {
    subscribersRef.current.push(fn);
    return () =>
      (subscribersRef.current = subscribersRef.current.filter(
        (subscription) => !Object.is(subscription, fn)
      ));
  }, []);

  /**
   * Forces the state to pull from auth storage. Primarily used for testing as
   * the auth storage is not meant to be modified outside this context.
   */
  const forceCheckAuthStorageAsync = useCallback(async () => {
    const nextOauthToken = await authStorage.getOAuthTokenAsync();
    const nextTokenExpiresAt = await authStorage.getTokenExpiresAtAsync();
    setOAuthToken(nextOauthToken);
    setTokenExpiresAt(nextTokenExpiresAt);
  }, [authStorage, setOAuthToken, setTokenExpiresAt]);

  const loginAsync = useCallback(
    async (authenticationCredentials: A): Promise<Response> => {
      try {
        const [nextOauthToken, authenticationResponse] =
          await authClient.authenticateAsync(authenticationCredentials);
        const nextTokenExpiresAt =
          await authStorage.storeOAuthTokenAndGetExpiresAtAsync(nextOauthToken);
        setOAuthToken(nextOauthToken);
        setTokenExpiresAt(nextTokenExpiresAt);
        resetAppDataLoaded();
        setAuthState(AuthState.RESTORING);
        notify({
          type: 'LoggedIn',
          reason: 'Logged with credentials',
          authState,
          accessToken: nextOauthToken.access_token,
          authorization: `Bearer ${nextOauthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt,
        });
        return authenticationResponse;
      } catch (e: unknown) {
        if (e instanceof AuthenticationClientError) {
          await authStorage.clearAsync();
          setOAuthToken(null);
          setTokenExpiresAt(0);
        }
        throw e;
      }
    },
    [
      authClient,
      authState,
      authStorage,
      notify,
      resetAppDataLoaded,
      setOAuthToken,
      setTokenExpiresAt,
    ]
  );

  /**
   * This will perform the logout. Client failures are ignored since there's no
   * point handling it.
   */
  const logoutAsync = useCallback(
    async (
      forced = false,
      postLogoutCallback: (() => void) | undefined = undefined
    ) => {
      if (!forced && authState !== AuthState.AUTHENTICATED) {
        throw new Error('cannot revoke token when not authenticated');
      }
      try {
        if (!oauthToken) {
          return;
        }
        await authClient.revokeAsync(oauthToken.refresh_token);
      } catch (e: unknown) {
        if (!(e instanceof AuthenticationClientError)) {
          throw e;
        }
      } finally {
        postLogoutCallback && postLogoutCallback();
        notify({
          type: 'LoggedOut',
          authState,
        });
        setAuthState(AuthState.TOKEN_REMOVAL);
      }
    },
    [authClient, authState, oauthToken, notify]
  );

  const backendReachable = useBackendReachable(endpointConfiguration);
  const appActive = useAppActiveState();

  const refreshAsync = useCallback(async () => {
    if (oauthToken) {
      await authStorage.storeOAuthTokenAndGetExpiresAtAsync({
        ...oauthToken,
        expires_in: -1,
      });
      await forceCheckAuthStorageAsync();
    } else {
      throw new Error('no token to invalidate');
    }
  }, [oauthToken, authStorage, forceCheckAuthStorageAsync]);

  useInitialAuthStateEffect({
    authState,
    setAuthState,
    notify,
    setOAuthToken,
    setTokenExpiresAt,
    signaled,
    authStorage,
    timeBeforeExpirationRefresh,
  });

  useTokenAvailableEffect({
    appActive,
    appDataLoaded,
    authClient,
    authState,
    authStorage,
    backendReachable,
    maxTimeoutForRefreshCheckMs: 60000,
    notify,
    oauthToken,
    resetAppDataLoaded,
    resetTokenProcessed,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
    signalAppDataLoaded,
    signaled,
    signalTokenProcessed,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    tokenProcessed,
    waitForSignalWhenDataIsLoaded,
    waitForSignalWhenNewTokenIsProcessed,
  });

  useNoTokenAvailableEffect({
    appActive,
    appDataLoaded,
    authClient,
    authState,
    authStorage,
    backendReachable,
    maxTimeoutForRefreshCheckMs: 60000,
    notify,
    oauthToken,
    resetAppDataLoaded,
    resetTokenProcessed,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
    signalAppDataLoaded,
    signaled,
    signalTokenProcessed,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    tokenProcessed,
    waitForSignalWhenDataIsLoaded,
    waitForSignalWhenNewTokenIsProcessed,
  });

  const contextValue: IAuth<A> = useMemo(
    () => ({
      accessToken: oauthToken?.access_token ?? null,
      accessTokenExpired: isTokenExpired(
        tokenExpiresAt,
        timeBeforeExpirationRefresh
      ),
      appDataLoaded: oauthToken ? appDataLoaded : true,
      authorization:
        !isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh) &&
        !!oauthToken
          ? `Bearer ${oauthToken.access_token}`
          : null,
      authState,
      backendReachable,
      baseUrl: endpointConfiguration.baseUrl,
      endpointConfiguration,
      forceCheckAuthStorageAsync,
      lastCheckAt: new Date(),
      loginAsync,
      logoutAsync,
      oauthToken,
      refreshAsync,
      setEndpointConfiguration: validatedSetEndpointConfiguration,
      signalAppDataLoaded,
      signalStart,
      signalTokenProcessed,
      subscribe,
      tokenExpiresAt,
    }),
    [
      appDataLoaded,
      authState,
      backendReachable,
      endpointConfiguration,
      forceCheckAuthStorageAsync,
      loginAsync,
      logoutAsync,
      oauthToken,
      refreshAsync,
      signalAppDataLoaded,
      signalStart,
      signalTokenProcessed,
      subscribe,
      timeBeforeExpirationRefresh,
      tokenExpiresAt,
      validatedSetEndpointConfiguration,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
