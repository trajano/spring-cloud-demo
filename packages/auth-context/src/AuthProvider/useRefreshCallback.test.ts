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
test('mostly mocked', async () => {
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
  const oauthTokenRef = { current: null };
  const tokenExpiresAtRef = { current: null };
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const { result } = renderHook<RefreshCallbackProps<any>, () => Promise<void>>(
    (props) => useRefreshCallback(props),
    {
      initialProps: {
        authState: AuthState.NEEDS_REFRESH,
        setAuthState,
        notify,
        tokenRefreshable: true,
        authStorage,
        netInfoState,
        oauthTokenRef,
        tokenExpiresAtRef,
        authClient,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(0);
  let refresh = result.current;

  authClient.refresh.mockResolvedValueOnce({
    access_token: 'newAccessToken',
    refresh_token: 'newRefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  });
  await refresh();
  expect(setAuthState).toBeCalledTimes(2);
  expect(setAuthState).toHaveBeenNthCalledWith(1, AuthState.REFRESHING);
  expect(setAuthState).toHaveBeenNthCalledWith(2, AuthState.AUTHENTICATED);
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
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const netInfoState = {} as NetInfoState;
  const authClient = jest.mocked(
    new AuthClient(buildSimpleEndpointConfiguration('http://asdf.com/'))
  );
  const oauthTokenRef = { current: null };
  const tokenExpiresAtRef = { current: null };
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const { result } = renderHook<RefreshCallbackProps<any>, () => Promise<void>>(
    (props) => useRefreshCallback(props),
    {
      initialProps: {
        authState: AuthState.NEEDS_REFRESH,
        setAuthState,
        notify,
        tokenRefreshable: false,
        authStorage,
        netInfoState,
        oauthTokenRef,
        tokenExpiresAtRef,
        authClient,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(0);
  let refresh = result.current;

  await refresh();
  expect(setAuthState).toBeCalledTimes(2);
  expect(setAuthState).toHaveBeenNthCalledWith(1, AuthState.REFRESHING);
  expect(setAuthState).toHaveBeenNthCalledWith(
    2,
    AuthState.BACKEND_INACCESSIBLE
  );
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
  const oauthTokenRef = { current: null };
  const tokenExpiresAtRef = { current: null };
  const authStorage = new AuthStore('auth', 'http://asdf.com/');
  const { result, rerender: rerenderRefreshCallback } = renderHook<
    RefreshCallbackProps<any>,
    () => Promise<void>
  >((props) => useRefreshCallback(props), {
    initialProps: {
      authState: AuthState.NEEDS_REFRESH,
      setAuthState,
      notify,
      tokenRefreshable: false,
      authStorage,
      netInfoState,
      oauthTokenRef,
      tokenExpiresAtRef,
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
      tokenRefreshable: false,
      notify,
      refresh: result.current,
    },
  });
  expect(setAuthState).toBeCalledTimes(1);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.BACKEND_INACCESSIBLE);
  rerenderRefreshCallback({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    notify,
    tokenRefreshable: false,
    authStorage,
    netInfoState,
    oauthTokenRef,
    tokenExpiresAtRef,
    authClient,
  });
  rerenderNeedsEffect({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    tokenRefreshable: false,
    notify,
    refresh: result.current,
  });

  // now simulate that token becomes refreshable again
  rerenderRefreshCallback({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    notify,
    tokenRefreshable: true,
    authStorage,
    netInfoState,
    oauthTokenRef,
    tokenExpiresAtRef,
    authClient,
  });
  rerenderNeedsEffect({
    authState: AuthState.BACKEND_INACCESSIBLE,
    setAuthState,
    tokenRefreshable: true,
    notify,
    refresh: result.current,
  });

  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);

  rerenderRefreshCallback({
    authState: AuthState.NEEDS_REFRESH,
    setAuthState,
    notify,
    tokenRefreshable: true,
    authStorage,
    netInfoState,
    oauthTokenRef,
    tokenExpiresAtRef,
    authClient,
  });

  // prep the response because the next effect will trigger
  authClient.refresh.mockResolvedValueOnce({
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
      tokenRefreshable: true,
      notify,
      refresh: result.current,
    })
  );

  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.REFRESHING);
  await waitFor(() => expect(authClient.refresh).toHaveBeenCalledTimes(1));
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.AUTHENTICATED);
});

test('refreshing while refreshing', async () => {
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const netInfoState = {} as NetInfoState;
  const authClient = jest.fn() as unknown as jest.Mocked<AuthClient<any>>;
  const authStorage = jest.fn() as unknown as jest.Mocked<AuthStore>;
  const oauthTokenRef = { current: null };
  const tokenExpiresAtRef = { current: null };
  const { result } = renderHook<RefreshCallbackProps<any>, () => Promise<void>>(
    (props) => useRefreshCallback(props),
    {
      initialProps: {
        authState: AuthState.REFRESHING,
        setAuthState,
        notify,
        tokenRefreshable: true,
        authStorage,
        netInfoState,
        oauthTokenRef,
        tokenExpiresAtRef,
        authClient,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(0);
  expect(notify).toBeCalledTimes(0);
  let refresh = result.current;
  await refresh();
  expect(notify).toBeCalledTimes(1);
  expect(notify).toBeCalledWith({
    type: 'Refreshing',
    reason: 'Already in progress',
    authState: AuthState.REFRESHING,
  });
});
