import { useDateState, useDeepState } from '@trajano/react-hooks';
import React, {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { AuthClient } from '../AuthClient';
import { AuthContext } from '../AuthContext';
import { AuthenticationClientError } from '../AuthenticationClientError';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { AuthStore, IAuthStore } from '../AuthStore';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import type { IAuth } from '../IAuth';
import type { OAuthToken } from '../OAuthToken';
import { initialAuthEventReducer } from './initialAuthEventReducer';
import { isTokenExpired } from './isTokenExpired';
import { useAppStateRefreshingEffect } from './useAppStateRefreshingEffect';
import { useBackendFailureTimeoutEffect } from './useBackendFailureTimeoutEffect';
import { useInitialAuthStateEffect } from './useInitialAuthStateEffect';
import { useNeedsRefreshEffect } from './useNeedsRefreshEffect';
import { useRefreshCallback } from './useRefreshCallback';
import { useRenderOnTokenEvent } from './useRenderOnTokenEvent';
import { useTokenExpirationTimeoutEffect } from './useTokenExpirationTimeoutEffect';

type AuthContextProviderProps = PropsWithChildren<{
  /**
   * Default endpoint configuration
   */
  defaultEndpointConfiguration: EndpointConfiguration;
  /**
   * AsyncStorage prefix used to store the authentication data. Applicable only to the default auth store.
   */
  storagePrefix?: string;
  /**
   * Time in milliseconds to consider refreshing the access token.  Defaults to 10 seconds.
   */
  timeBeforeExpirationRefresh?: number;
  /**
   * Alternative auth storage.
   */
  authStorage?: IAuthStore;
  onRefreshError?: (reason: unknown) => void;
}>;

/**
 * Auth provider starts at the INITIAL state in that state it will load up all the necessary data from the stores and set the other states up
 * correctly.
 *
 * Only a few things are stored in the state
 * @param param0
 * @returns
 */
export function AuthProvider<A = unknown>({
  defaultEndpointConfiguration,
  children,
  timeBeforeExpirationRefresh = 10000,
  storagePrefix = 'auth',
  onRefreshError: inOnRefreshError,
  authStorage: inAuthStorage,
}: AuthContextProviderProps): ReactElement<AuthContextProviderProps> {
  const [endpointConfiguration, setEndpointConfiguration] = useState(
    defaultEndpointConfiguration
  );
  const authClient = useMemo(
    () => new AuthClient<A>(endpointConfiguration),
    [endpointConfiguration]
  );

  const onRefreshError = useCallback(
    (reason: unknown) =>
      inOnRefreshError ? inOnRefreshError(reason) : console.error(reason),
    [inOnRefreshError]
  );
  /**
   * Auth storage.  If inAuthStorage is provided it will use that otherwise it will create a new one.
   */
  const authStorage = useMemo(
    () =>
      inAuthStorage ??
      new AuthStore(storagePrefix, endpointConfiguration.baseUrl),
    [endpointConfiguration.baseUrl, inAuthStorage, storagePrefix]
  );

  const subscribersRef = useRef<((event: AuthEvent) => void)[]>([]);

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

  /**
   * Last auth events.  Eventually this will be removed and placed with the app rather than the context.
   * Kept for debugging.
   */
  const [initialAuthEvents, pushAuthEvent] = useReducer(
    initialAuthEventReducer,
    []
  );

  /**
   * Notifies subscribers.  There's a specific handler if it is "Unauthenticated" that the provider handles.
   * These and other functions are not wrapped in useCallback because when any of the state changes it
   * will render these anyway and we're not optimizing from the return value either.
   */
  const notify = useCallback(function notify(event: AuthEvent) {
    pushAuthEvent(event);
    subscribersRef.current.forEach((fn) => fn(event));
  }, []);

  const { backendReachable, netInfoState } = useRenderOnTokenEvent({
    authState,
    setAuthState,
    notify,
    oauthToken,
    tokenExpiresAt,
    timeBeforeExpirationRefresh,
    endpointConfiguration,
  });

  const { timeout: tokenExpirationTimeout } = useTokenExpirationTimeoutEffect({
    authState,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh,
    tokenExpiresAt,
    notify,
  });

  const { timeout: backendFailureTimeout } = useBackendFailureTimeoutEffect({
    authState,
    setAuthState,
    notify,
    backendFailureTimeout: 60000,
  });

  function subscribe(fn: (event: AuthEvent) => void) {
    subscribersRef.current.push(fn);
    return () =>
      (subscribersRef.current = subscribersRef.current.filter(
        (subscription) => !Object.is(subscription, fn)
      ));
  }

  /**
   * Forces the state to pull from auth storage.  Primarily used for testing as the auth storage is not
   * meant to be modified outside this context.
   */
  async function forceCheckAuthStorageAsync() {
    const nextOauthToken = await authStorage.getOAuthTokenAsync();
    const nextTokenExpiresAt = await authStorage.getTokenExpiresAtAsync();
    setOAuthToken(nextOauthToken);
    setTokenExpiresAt(nextTokenExpiresAt);
  }

  async function loginAsync(authenticationCredentials: A): Promise<Response> {
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
  }

  /**
   * This will perform the logout.  Client failures are ignored since there's no point handling it.
   */
  async function logoutAsync() {
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
      await authStorage.clearAsync();
      setOAuthToken(null);
      setTokenExpiresAt(0);
      setAuthState(AuthState.UNAUTHENTICATED);
      notify({
        type: 'LoggedOut',
        authState,
      });
      notify({
        type: 'Unauthenticated',
        authState,
        reason: 'Logged out',
      });
    }
  }

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

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        if (nextAppState === 'active' && authState === AuthState.REFRESHING) {
          setAuthState(AuthState.NEEDS_REFRESH);
          notify({
            type: 'CheckRefresh',
            authState,
            reason:
              'AuthState === REFRESHING but state just switched to Active, forcing recheck',
            backendReachable,
            tokenExpiresAt,
          });
        }
      }
    );
    return () => {
      appStateSubscription.remove();
    };
  }, [authState, setAuthState, notify, backendReachable, tokenExpiresAt]);

  useInitialAuthStateEffect({
    authState,
    setAuthState,
    notify,
    setOAuthToken,
    setTokenExpiresAt,
    authStorage,
    timeBeforeExpirationRefresh,
  });

  useNeedsRefreshEffect({
    authState,
    setAuthState,
    notify,
    backendReachable: backendReachable,
    refreshAsync,
    onRefreshError,
  });

  useAppStateRefreshingEffect({
    authState,
    setAuthState,
    notify,
    oauthToken,
    tokenExpiresAt,
    backendReachable,
    timeBeforeExpirationRefresh,
  });

  // Temporarily disable react-hooks/exhaustive-deps since we want the timeouts to trigger.
  /* eslint-disable react-hooks/exhaustive-deps */
  const contextValue: IAuth = useMemo(
    () => ({
      accessToken: oauthToken?.access_token ?? null,
      accessTokenExpired: isTokenExpired(
        tokenExpiresAt,
        timeBeforeExpirationRefresh
      ),
      authorization:
        !isTokenExpired(tokenExpiresAt, timeBeforeExpirationRefresh) &&
        !!oauthToken
          ? `Bearer ${oauthToken?.access_token}`
          : null,
      authState,
      backendReachable,
      baseUrl: endpointConfiguration.baseUrl,
      endpointConfiguration,
      lastCheckAt: new Date(),
      oauthToken,
      tokenExpiresAt,
      initialAuthEvents,
      forceCheckAuthStorageAsync,
      loginAsync,
      logoutAsync,
      refreshAsync,
      setEndpointConfiguration,
      subscribe,
    }),
    [
      authState,
      oauthToken,
      backendReachable,
      tokenExpiresAt,
      endpointConfiguration,
      tokenExpirationTimeout,
      backendFailureTimeout,
      initialAuthEvents,
      timeBeforeExpirationRefresh,
      forceCheckAuthStorageAsync,
      loginAsync,
      logoutAsync,
      refreshAsync,
      setEndpointConfiguration,
      subscribe,
    ]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}