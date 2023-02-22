import { useDateState, useDeepState } from '@trajano/react-hooks';
import React, {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { isTokenExpired } from './isTokenExpired';
import { AuthClient } from '../AuthClient';
import { AuthContext } from '../AuthContext';
import { AuthenticationClientError } from '../AuthenticationClientError';
import { AuthStore, IAuthStore } from '../AuthStore';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import type { IAuth } from '../IAuth';
import type { OAuthToken } from '../OAuthToken';
import { useAppActiveState } from '../useAppActiveState';
import { useBackendReachable } from '../useBackendReachable';
import { validateEndpointConfiguration } from '../validateEndpointConfiguration';
import { useInitialAuthStateEffect } from './useInitialAuthStateEffect';
import { useNoTokenAvailableEffect } from './useNoTokenAvailableEffect';
import { useRefreshCallback } from './useRefreshCallback';
import { useRenderOnTokenEvent } from './useRenderOnTokenEvent';
import { useTokenAvailableEffect } from './useTokenAvailableEffect';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';

type AuthContextProviderProps = PropsWithChildren<{
  /** Default endpoint configuration */
  defaultEndpointConfiguration: EndpointConfiguration;
  /**
   * AsyncStorage prefix used to store the authentication data. Applicable only
   * to the default auth store.
   */
  storagePrefix?: string;
  /**
   * Time in milliseconds to consider refreshing the access token. Defaults to
   * 10 seconds.
   */
  timeBeforeExpirationRefresh?: number;
  /** Alternative auth storage. */
  authStorage?: IAuthStore;
  onRefreshError?: (reason: unknown) => void;
  /**
   * This is a callback that is called when in {@link AuthState.RESTORING} state.
   * Defaults to noop.
   *
   * @callback
   */
  restoreAppDataAsyncCallback?: (() => void) | (() => PromiseLike<void>);
}>;

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
  restoreAppDataAsyncCallback = () => Promise.resolve()
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
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

  /** Application data loaded state. */
  const [appDataLoaded, setAppDataLoaded] = useState(false);

  /** OAuth token state. */
  const [oauthToken, setOAuthToken] = useDeepState<OAuthToken | null>(null);

  /** Token expires at state. */
  const [tokenExpiresAt, setTokenExpiresAt] = useDateState(0);

  /**
   * Notifies subscribers. There's a specific handler if it is "Unauthenticated"
   * that the provider handles. These and other functions are not wrapped in
   * useCallback because when any of the state changes it will render these
   * anyway and we're not optimizing from the return value either.
   */
  const notify = useCallback((event: AuthEvent) => {
    subscribersRef.current.forEach((fn) => fn(event));
  }, []);

  const { netInfoState } = useRenderOnTokenEvent({
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
        setAuthState(AuthState.AUTHENTICATED);
        notify({
          type: 'LoggedIn',
          reason: 'Logged with credentials',
          authState,
          accessToken: nextOauthToken.access_token,
          authorization: `Bearer ${nextOauthToken.access_token}`,
          tokenExpiresAt: nextTokenExpiresAt,
        });
        notify({
          type: 'Authenticated',
          reason: 'Login',
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
  const refreshAsync = useRefreshCallback({
    authState,
    setAuthState,
    notify,
    oauthToken,
    authStorage,
    setOAuthToken,
    setTokenExpiresAt,
    authClient,
    netInfoState,
    backendReachable,
  });

  useInitialAuthStateEffect({
    authState,
    setAuthState,
    notify,
    setOAuthToken,
    setTokenExpiresAt,
    authStorage,
    timeBeforeExpirationRefresh,
  });

  useTokenAvailableEffect({
    appActive,
    appDataLoaded,
    authState,
    authClient,
    backendReachable,
    oauthToken,
    authStorage,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    maxTimeoutForRefreshCheckMs: 60000,
    notify,
    restoreAppDataAsyncCallback,
    setAppDataLoaded,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
  });

  useNoTokenAvailableEffect({
    appActive,
    appDataLoaded,
    authState,
    authClient,
    backendReachable,
    oauthToken,
    authStorage,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    maxTimeoutForRefreshCheckMs: 60000,
    notify,
    restoreAppDataAsyncCallback,
    setAppDataLoaded,
    setAuthState,
    setOAuthToken,
    setTokenExpiresAt,
  });

  // Temporarily disable react-hooks/exhaustive-deps since we want the timeouts to trigger.
  /* eslint-disable react-hooks/exhaustive-deps */
  const contextValue: IAuth<A> = useMemo(
    () => ({
      accessToken: oauthToken?.access_token ?? null,
      accessTokenExpired: isTokenExpired(
        tokenExpiresAt,
        timeBeforeExpirationRefresh
      ),
      authorization:
        !isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh) &&
          !!oauthToken
          ? `Bearer ${oauthToken.access_token}`
          : null,
      authState,
      backendReachable,
      baseUrl: endpointConfiguration.baseUrl,
      endpointConfiguration,
      lastCheckAt: new Date(),
      oauthToken,
      tokenExpiresAt,
      initialAuthEvents: [],
      forceCheckAuthStorageAsync,
      loginAsync,
      logoutAsync,
      refreshAsync,
      setEndpointConfiguration: validatedSetEndpointConfiguration,
      subscribe,
    }),
    [
      authState,
      oauthToken,
      backendReachable,
      tokenExpiresAt,
      endpointConfiguration,
      timeBeforeExpirationRefresh,
      forceCheckAuthStorageAsync,
      loginAsync,
      logoutAsync,
      refreshAsync,
      validatedSetEndpointConfiguration,
      subscribe,
    ]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
