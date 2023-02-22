import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import '@testing-library/jest-native/extend-expect';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { addMilliseconds, subMilliseconds } from 'date-fns';
import fetchMock from 'fetch-mock';
import React, { useCallback, useEffect } from 'react';
import { AppState, Pressable, Text } from 'react-native';

import { AuthProvider } from './AuthProvider';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { AuthStore } from '../AuthStore';
import type { OAuthToken } from '../OAuthToken';
import { buildSimpleEndpointConfiguration } from '../buildSimpleEndpointConfiguration';
import { useAuth } from '../useAuth';

const specimenInstant = new Date('2022-11-11T12:00:00Z');
jest.mock('@react-native-community/netinfo');
let globalFetch: typeof fetch;
let fetchConfigResponse: (new () => Response) | undefined;
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: false });
  jest.setSystemTime(specimenInstant);
  AppState.currentState = 'active';
  AsyncStorage.clear().catch(console.error);
  fetchConfigResponse = fetchMock.config.Response;
  globalFetch = global.fetch;
  global.fetch = fetchMock.sandbox() as unknown as typeof fetch;

  jest.mocked(NetInfo).refresh.mockResolvedValue({
    type: NetInfoStateType.wifi,
    isConnected: true,
    isInternetReachable: true,
    details: {
      ssid: null,
      bssid: null,
      strength: null,
      ipAddress: null,
      subnet: null,
      frequency: null,
      isConnectionExpensive: false,
      linkSpeed: null,
      rxLinkSpeed: null,
      txLinkSpeed: null,
    },
  });
});
afterEach(cleanup);
afterEach(() => {
  fetchMock.reset();
  fetchMock.config.Response = fetchConfigResponse;
  global.fetch = globalFetch;
  jest.useRealTimers();
  AppState.currentState = 'unknown';
});

function MyComponent({
  notifications,
  signalToStart = false,
}: {
  notifications: (authEvent: AuthEvent) => void;
  signalToStart?: boolean;
}) {
  const {
    authState,
    loginAsync: login,
    tokenExpiresAt: accessTokenExpiresOn,
    accessToken,
    backendReachable,
    signalStart,
    subscribe,
  } = useAuth();
  const doLogin = useCallback(async () => login({ user: 'test' }), [login]);
  useEffect(() => subscribe(notifications), [notifications, subscribe]);
  useEffect(() => {
    if (signalToStart) {
      setTimeout(signalStart, 1000);
    }
  }, [signalToStart, signalStart]);
  return (
    <>
      <Text testID="hello">{AuthState[authState]}</Text>
      <Text testID="accessToken">{accessToken}</Text>
      <Text testID="tokenRefreshable">
        {backendReachable ? 'tokenRefreshable' : ''}
      </Text>
      <Text testID="accessTokenExpiresOn">
        {accessTokenExpiresOn.toISOString()}
      </Text>
      <Pressable onPress={doLogin}>
        <Text testID="login">Login</Text>
      </Pressable>
    </>
  );
}

it('Check storage', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    addMilliseconds(specimenInstant, 600000).toISOString()
  );
  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeFalsy();
});

it('Check storage expired', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );
  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();
});

it('Restore saved not expired', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    addMilliseconds(specimenInstant, 600000).toISOString()
  );

  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock.get('https://asdf.com/ping', { body: { ok: true } }).postOnce(
    'https://asdf.com/refresh',
    new Promise((res) =>
      setTimeout(res, 100, {
        body: {
          access_token: 'newAccessToken',
          refresh_token: 'NotThePreviousRefreshToken',
          token_type: 'Bearer',
          expires_in: 600,
        } as OAuthToken,
      })
    )
  );
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
    >
      <MyComponent notifications={notifications} />
    </AuthProvider>
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TokenLoaded',
        authState: AuthState.INITIAL,
        reason: 'active token restored from storage on initial state',
      } as Partial<AuthEvent>)
    )
  );
  expect(screen.getByTestId('accessToken')).toHaveTextContent('oldAccessToken');
  expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED');
  expect(screen.getByTestId('accessToken')).toHaveTextContent('oldAccessToken');
  expect(screen.getByTestId('accessTokenExpiresOn')).toHaveTextContent(
    addMilliseconds(specimenInstant, 600000).toISOString()
  );
  await waitFor(() => expect(jest.getTimerCount()).toBe(1));
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('Restore saved expired', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );

  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();

  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/refresh', {
      body: {
        access_token: 'newAccessToken',
        refresh_token: 'NotThePreviousRefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    });
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
    >
      <MyComponent notifications={notifications} />
    </AuthProvider>
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');

  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Refreshing' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Authenticated' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED')
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('Restore saved expired with data load', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );

  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();

  const dataLoaded = jest.fn() as jest.Mock<() => void>;
  const notifications = jest.fn((authEvent: AuthEvent) => {
    if (authEvent.type === 'WaitForDataLoaded') {
      dataLoaded();
      authEvent.signalDataLoaded();
    }
  });
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/refresh', {
      body: {
        access_token: 'newAccessToken',
        refresh_token: 'NotThePreviousRefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    });
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
      waitForSignalWhenDataIsLoaded
    >
      <MyComponent notifications={notifications} />
    </AuthProvider>
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');

  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );
  await act(() => Promise.resolve());
  expect(dataLoaded).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Refreshing' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Authenticated' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED')
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
  expect(dataLoaded).toHaveBeenCalledTimes(1);
});

it('Restore saved expired with start signal and data load', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );

  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();

  const dataLoaded = jest.fn() as jest.Mock<() => void>;
  const notifications = jest.fn((authEvent: AuthEvent) => {
    if (authEvent.type === 'WaitForDataLoaded') {
      dataLoaded();
      authEvent.signalDataLoaded();
    }
  });
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/refresh', {
      body: {
        access_token: 'newAccessToken',
        refresh_token: 'NotThePreviousRefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    });
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
      waitForSignalToStart
      waitForSignalWhenDataIsLoaded
    >
      <MyComponent notifications={notifications} signalToStart />
    </AuthProvider>
  );
  await act(() => Promise.resolve());
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');
  await act(() => jest.advanceTimersByTime(1000));
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );
  expect(dataLoaded).toHaveBeenCalledTimes(1);
  await act(() => Promise.resolve());
  await waitFor(
    () => {
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Refreshing' } as Partial<AuthEvent>)
      );
    },
    {
      onTimeout: (err) => {
        console.log(notifications.mock.calls);
        throw err;
      },
    }
  );
  await waitFor(() => {
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Authenticated' } as Partial<AuthEvent>)
    );
  });
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED')
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
  expect(dataLoaded).toHaveBeenCalledTimes(1);
});

it('Restore saved expired but broken token response', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );

  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();

  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/refresh', {
      status: 200,
      body: 'this is not json',
    });
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
    >
      <MyComponent notifications={notifications} />
    </AuthProvider>
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');

  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenExpiration' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Refreshing' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TokenExpiration',
        reason: 'unable to parse response as JSON',
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('BACKEND_FAILURE')
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('Restore saved expired but 500 refresh response', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );

  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();

  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/refresh', {
      status: 500,
      body: 'this is not json',
    });
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
    >
      <MyComponent notifications={notifications} />
    </AuthProvider>
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');

  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TokenLoaded',
        authState: AuthState.INITIAL,
      } as Partial<AuthEvent>)
    )
  );
  await act(() => Promise.resolve());
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Refreshing' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TokenExpiration',
        reason: 'HTTP Error 500',
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('BACKEND_FAILURE')
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('Restore saved expired but error refresh response', async () => {
  const oldAccessToken: OAuthToken = {
    access_token: 'oldAccessToken',
    refresh_token: 'RefreshToken',
    token_type: 'Bearer',
    expires_in: 600,
  };
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..oauthToken',
    JSON.stringify(oldAccessToken)
  );
  await AsyncStorage.setItem(
    'auth.https://asdf.com/..tokenExpiresAt',
    subMilliseconds(specimenInstant, 600000).toISOString()
  );

  const authStore = new AuthStore('auth', 'https://asdf.com/');
  expect(await authStore.isExpired()).toBeTruthy();

  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/refresh', { status: 1 });
  const { unmount } = render(
    <AuthProvider
      defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
        'https://asdf.com/'
      )}
    >
      <MyComponent notifications={notifications} />
    </AuthProvider>
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('INITIAL');

  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TokenLoaded' } as Partial<AuthEvent>)
    )
  );
  await act(() => Promise.resolve());
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Refreshing' } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TokenExpiration',
        reason: 'HTTP Error 1',
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('BACKEND_FAILURE')
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
});
