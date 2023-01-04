import { expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import type { NetInfoState } from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-hooks';
import { addMilliseconds } from 'date-fns';
import type { Dispatch, SetStateAction } from 'react';
import { buildSimpleEndpointConfiguration } from '..';
import { AuthClient } from '../AuthClient';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';
import {
  NeedsRefreshEffectProps,
  useNeedsRefreshEffect,
} from './useNeedsRefreshEffect';
import { RefreshCallbackProps, useRefreshCallback } from './useRefreshCallback';

jest.mock('../AuthClient');
afterEach(() => {
  AsyncStorage.clear();
});

test('mostly mocked', async () => {
  const setOAuthToken = jest.fn();
  const setTokenExpiresAt = jest.fn();
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.http://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.http://asdf.com/..tokenExpiresAt',
    addMilliseconds(Date.now(), 600000).toISOString()
  );

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const netInfoState = {} as NetInfoState;
  const authClient = jest.mocked(
    new AuthClient(buildSimpleEndpointConfiguration('http://asdf.com/'))
  );
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const { result } = renderHook<
    RefreshCallbackProps<unknown>,
    () => Promise<void>
  >((props) => useRefreshCallback(props), {
    initialProps: {
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      notify,
      backendReachable: true,
      authStorage,
      netInfoState,
      oauthToken: oldAccessToken,
      authClient,
      setOAuthToken,
      setTokenExpiresAt,
    },
  });
  expect(setAuthState).toHaveBeenCalledTimes(0);
  const refresh = result.current;

  authClient.refreshAsync.mockResolvedValueOnce({
    access_token: 'newAccessToken',
    refresh_token: 'newRefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  });
  await refresh();
  expect(setAuthState).toHaveBeenCalledTimes(2);
  expect(setAuthState).toHaveBeenNthCalledWith(1, AuthState.REFRESHING);
  expect(setAuthState).toHaveBeenNthCalledWith(2, AuthState.AUTHENTICATED);
});

test('no token stored', async () => {
  const setOAuthToken = jest.fn();
  const setTokenExpiresAt = jest.fn();
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const netInfoState = {} as NetInfoState;
  const authClient = jest.mocked(
    new AuthClient(buildSimpleEndpointConfiguration('http://asdf.com/'))
  );
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const { result } = renderHook<
    RefreshCallbackProps<Record<string, unknown>>,
    () => Promise<void>
  >((props) => useRefreshCallback(props), {
    initialProps: {
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      notify,
      backendReachable: true,
      authStorage,
      netInfoState,
      oauthToken: null,
      setOAuthToken,
      setTokenExpiresAt,
      authClient,
    },
  });
  expect(setAuthState).toHaveBeenCalledTimes(0);
  const refresh = result.current;

  await act(() => refresh());
  expect(setAuthState).toHaveBeenCalledTimes(2);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.UNAUTHENTICATED);
});

test('forced refresh while not token is not refreshable', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.http://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.http://asdf.com/..tokenExpiresAt',
    addMilliseconds(Date.now(), 600000).toISOString()
  );

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const setOAuthToken = jest.fn();
  const setTokenExpiresAt = jest.fn();
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const netInfoState = {} as NetInfoState;
  const authClient = jest.mocked(
    new AuthClient(buildSimpleEndpointConfiguration('http://asdf.com/'))
  );
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const { result } = renderHook<
    RefreshCallbackProps<Record<string, unknown>>,
    () => Promise<void>
  >((props) => useRefreshCallback(props), {
    initialProps: {
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      notify,
      backendReachable: false,
      authStorage,
      netInfoState,
      oauthToken: oldAccessToken,
      setOAuthToken,
      setTokenExpiresAt,
      authClient,
    },
  });
  expect(setAuthState).toHaveBeenCalledTimes(0);
  const refresh = result.current;

  await act(async () => {
    await refresh();
  });
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.BACKEND_INACCESSIBLE);
});

test('token not refreshable then it becomes refreshable with needsRefreshEffect', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.http://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.http://asdf.com/..tokenExpiresAt',
    addMilliseconds(Date.now(), 600000).toISOString()
  );

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const netInfoState = {} as NetInfoState;
  const authClient = jest.mocked(
    new AuthClient(buildSimpleEndpointConfiguration('http://asdf.com/'))
  );
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const setOAuthToken = jest.fn();
  const setTokenExpiresAt = jest.fn();
  const onRefreshError = jest.fn();
  const { result, rerender: rerenderRefreshCallback } = renderHook<
    RefreshCallbackProps<Record<string, unknown>>,
    () => Promise<void>
  >((props) => useRefreshCallback(props), {
    initialProps: {
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      notify,
      backendReachable: false,
      authStorage,
      netInfoState,
      oauthToken: {
        access_token: 'old',
        expires_in: 23,
        refresh_token: 'ref',
        token_type: 'Bearer',
      },
      setOAuthToken,
      setTokenExpiresAt,
      authClient,
    },
  });
  const { waitFor, rerender: rerenderNeedsEffect } = renderHook<
    NeedsRefreshEffectProps,
    void
  >((props) => useNeedsRefreshEffect(props), {
    initialProps: {
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      backendReachable: false,
      notify,
      onRefreshError,
      refreshAsync: result.current,
    },
  });
  expect(setAuthState).toHaveBeenCalledTimes(1);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.BACKEND_INACCESSIBLE);
  rerenderRefreshCallback({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    notify,
    backendReachable: false,
    authStorage,
    netInfoState,
    oauthToken: {
      access_token: 'old',
      expires_in: 23,
      refresh_token: 'ref',
      token_type: 'Bearer',
    },
    setOAuthToken,
    setTokenExpiresAt,
    authClient,
  });
  rerenderNeedsEffect({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    backendReachable: false,
    notify,
    onRefreshError,
    refreshAsync: result.current,
  });

  // now simulate that token becomes refreshable again
  rerenderRefreshCallback({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    notify,
    backendReachable: true,
    authStorage,
    netInfoState,
    oauthToken: {
      access_token: 'old',
      expires_in: 23,
      refresh_token: 'ref',
      token_type: 'Bearer',
    },
    setOAuthToken,
    setTokenExpiresAt,
    authClient,
  });
  rerenderNeedsEffect({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    backendReachable: true,
    notify,
    onRefreshError,
    refreshAsync: result.current,
  });

  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);

  rerenderRefreshCallback({
    authState: AuthState.NEEDS_REFRESH,
    setAuthState,
    notify,
    backendReachable: true,
    authStorage,
    netInfoState,
    oauthToken: {
      access_token: 'old',
      expires_in: 23,
      refresh_token: 'ref',
      token_type: 'Bearer',
    },
    setOAuthToken,
    setTokenExpiresAt,
    authClient,
  });

  // prep the response because the next effect will trigger
  authClient.refreshAsync.mockResolvedValueOnce({
    access_token: 'newAccessToken',
    refresh_token: 'newRefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  });
  setAuthState.mockClear();
  notify.mockClear();

  act(() =>
    rerenderNeedsEffect({
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      backendReachable: true,
      notify,
      onRefreshError,
      refreshAsync: result.current,
    })
  );

  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.REFRESHING);
  await waitFor(() => expect(authClient.refreshAsync).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(setAuthState).toHaveBeenLastCalledWith(AuthState.AUTHENTICATED)
  );
  expect(onRefreshError).toHaveBeenCalledTimes(0);
});
