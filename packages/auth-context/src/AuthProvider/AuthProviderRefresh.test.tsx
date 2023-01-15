import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import fetchMock from 'fetch-mock';
import React, { useCallback, useEffect } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { buildSimpleEndpointConfiguration } from '../buildSimpleEndpointConfiguration';
import type { OAuthToken } from '../OAuthToken';
import { useAuth } from '../useAuth';
import { AuthProvider } from './AuthProvider';

const specimenInstant = new Date('2022-11-11T12:00:00Z');
let globalFetch: typeof fetch;
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(specimenInstant);
  AppState.currentState = 'active';
  AsyncStorage.clear();
  globalFetch = global.fetch;
  global.fetch = fetchMock.sandbox() as unknown as typeof fetch;
});
afterEach(cleanup);
afterEach(() => {
  fetchMock.reset();
  global.fetch = globalFetch;
  jest.useRealTimers();
  AppState.currentState = 'unknown';
});

function MyComponent({ notifications }: { notifications: () => void }) {
  const {
    authState,
    loginAsync: login,
    tokenExpiresAt: accessTokenExpiresOn,
    accessToken,
    authorization,
    backendReachable: tokenRefreshable,
    subscribe,
  } = useAuth();
  useEffect(() => subscribe(notifications), [notifications, subscribe]);
  const doLogin = useCallback(async () => login({ user: 'test' }), [login]);
  return (
    <>
      <Text testID="hello">{AuthState[authState]}</Text>
      <Text testID="accessToken">{accessToken}</Text>
      <Text testID="authorization">{authorization}</Text>
      <Text testID="tokenRefreshable">
        {tokenRefreshable ? 'tokenRefreshable' : ''}
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

it('Refresh two times', async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/auth', {
      body: {
        access_token: 'freshAccessToken',
        refresh_token: 'RefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    })
    .postOnce('https://asdf.com/refresh', {
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
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    )
  );
  notifications.mockClear();

  fireEvent.press(screen.getByTestId('login'));
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LoggedIn',
        accessToken: 'freshAccessToken',
      } as Partial<AuthEvent>)
    )
  );
  expect(notifications).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'Authenticated',
      accessToken: 'freshAccessToken',
    } as Partial<AuthEvent>)
  );
  expect(screen.getByTestId('accessToken')).toHaveTextContent(
    'freshAccessToken'
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED');
  notifications.mockClear();

  const tokenExpiresAtFromStore = await AsyncStorage.getItem(
    'auth.https://asdf.com/..tokenExpiresAt'
  );
  expect(tokenExpiresAtFromStore).not.toBeNull();
  const tokenExpiresAt = new Date(tokenExpiresAtFromStore!);
  act(() =>
    jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000)
  );
  expect(notifications).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'TokenExpiration',
      authState: AuthState.AUTHENTICATED,
    } as Partial<AuthEvent>)
  );
  expect(notifications).toHaveBeenCalledWith({
    type: 'Refreshing',
    authState: AuthState.NEEDS_REFRESH,
    reason: 'from NeedsRefresh',
  });
  expect(screen.getByTestId('hello')).toHaveTextContent('REFRESHING');
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED')
  );
  expect(screen.getByTestId('accessToken')).toHaveTextContent('newAccessToken');

  // do second refresh
  fetchMock.postOnce(
    'https://asdf.com/refresh',
    {
      body: {
        access_token: 'newAccessTokenPartTwo',
        refresh_token: 'NotThePreviousRefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    },
    { overwriteRoutes: true }
  );
  notifications.mockClear();

  const secondTokenExpiresAtFromStore = await AsyncStorage.getItem(
    'auth.https://asdf.com/..tokenExpiresAt'
  );
  expect(secondTokenExpiresAtFromStore).not.toBeNull();
  const secondTokenExpiresAt = new Date(secondTokenExpiresAtFromStore!);
  act(() =>
    jest.advanceTimersByTime(
      secondTokenExpiresAt.getTime() - Date.now() - 10000
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Refreshing',
        authState: AuthState.NEEDS_REFRESH,
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Authenticated',
        accessToken: 'newAccessTokenPartTwo',
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED')
  );
  await waitFor(() =>
    expect(screen.getByTestId('accessToken')).toHaveTextContent(
      'newAccessTokenPartTwo'
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('authorization')).toHaveTextContent(
      'Bearer newAccessTokenPartTwo'
    )
  );
  await waitFor(() => expect(jest.getTimerCount()).toBe(1));
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('Refresh 500 then successful', async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get('https://asdf.com/ping', { body: { ok: true } })
    .post('https://asdf.com/auth', {
      body: {
        access_token: 'freshAccessToken',
        refresh_token: 'RefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    });

  fetchMock.postOnce('https://asdf.com/refresh', {
    status: 500,
    body: { error: 'server_error' },
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
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    )
  );
  notifications.mockClear();

  fireEvent.press(screen.getByTestId('login'));
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LoggedIn',
        accessToken: 'freshAccessToken',
      } as Partial<AuthEvent>)
    )
  );
  expect(notifications).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'Authenticated',
      accessToken: 'freshAccessToken',
    } as Partial<AuthEvent>)
  );
  expect(screen.getByTestId('accessToken')).toHaveTextContent(
    'freshAccessToken'
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED');
  notifications.mockClear();

  const tokenExpiresAtFromStore = await AsyncStorage.getItem(
    'auth.https://asdf.com/..tokenExpiresAt'
  );
  expect(tokenExpiresAtFromStore).not.toBeNull();
  const tokenExpiresAt = new Date(tokenExpiresAtFromStore!);
  act(() =>
    jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000)
  );
  expect(notifications).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'TokenExpiration',
      authState: AuthState.AUTHENTICATED,
    } as Partial<AuthEvent>)
  );
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Refreshing',
        reason: 'from NeedsRefresh',
        authState: AuthState.NEEDS_REFRESH,
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('REFRESHING')
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('BACKEND_FAILURE')
  );
  /*
   * expect(notifications).toBeCalledWith(
   *   expect.objectContaining({
   *     type: 'CheckRefresh',
   *     authState: AuthState.BACKEND_FAILURE,
   *   } as Partial<AuthEvent>)
   * );
   */

  // do second refresh
  fetchMock.postOnce(
    'https://asdf.com/refresh',
    {
      body: {
        access_token: 'newAccessTokenPartTwo',
        refresh_token: 'NotThePreviousRefreshToken',
        token_type: 'Bearer',
        expires_in: 600,
      } as OAuthToken,
    },
    { overwriteRoutes: true }
  );
  await waitFor(
    () =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CheckRefresh',
          authState: AuthState.BACKEND_FAILURE,
          reason: 'timeout for backend failure retry set',
        } as Partial<AuthEvent>)
      ),
    {
      onTimeout(e) {
        console.log(notifications.mock.calls);
        throw e;
      },
    }
  );
  notifications.mockClear();
  act(() => jest.runAllTimers());
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Refreshing',
        authState: AuthState.NEEDS_REFRESH,
        reason: 'from NeedsRefresh',
      } as Partial<AuthEvent>)
    )
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('REFRESHING')
  );
  await waitFor(
    () =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Authenticated',
          accessToken: 'newAccessTokenPartTwo',
        } as Partial<AuthEvent>)
      ),
    {
      onTimeout(e) {
        console.log(notifications.mock.calls);
        throw e;
      },
    }
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED')
  );

  await waitFor(
    () => {
      expect(jest.getTimerCount()).toBe(1);
    },
    {
      onTimeout(e) {
        console.log(notifications.mock.calls);
        throw e;
      },
    }
  );

  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('Refresh fail with 401', async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock.get('https://asdf.com/ping', { body: { ok: true } }).post(
    'https://asdf.com/auth',
    new Promise((res) =>
      setTimeout(res, 100, {
        body: {
          access_token: 'freshAccessToken',
          refresh_token: 'RefreshToken',
          token_type: 'Bearer',
          expires_in: 600,
        } as OAuthToken,
      })
    )
  );

  fetchMock.postOnce('https://asdf.com/refresh', {
    status: 401,
    body: { error: 'unauthorized_client' },
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
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    )
  );
  notifications.mockClear();

  fireEvent.press(screen.getByTestId('login'));
  await waitFor(() =>
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LoggedIn',
        accessToken: 'freshAccessToken',
      } as Partial<AuthEvent>)
    )
  );
  expect(notifications).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'Authenticated',
      accessToken: 'freshAccessToken',
    } as Partial<AuthEvent>)
  );
  expect(screen.getByTestId('accessToken')).toHaveTextContent(
    'freshAccessToken'
  );
  expect(screen.getByTestId('hello')).toHaveTextContent('AUTHENTICATED');
  notifications.mockClear();

  const tokenExpiresAtFromStore = await AsyncStorage.getItem(
    'auth.https://asdf.com/..tokenExpiresAt'
  );
  expect(tokenExpiresAtFromStore).not.toBeNull();
  const tokenExpiresAt = new Date(tokenExpiresAtFromStore!);
  act(() =>
    jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000)
  );
  expect(notifications).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'TokenExpiration',
      authState: AuthState.AUTHENTICATED,
    } as Partial<AuthEvent>)
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('REFRESHING')
  );
  await waitFor(() =>
    expect(screen.getByTestId('hello')).toHaveTextContent('UNAUTHENTICATED')
  );

  expect(
    await AsyncStorage.getItem('auth.https://asdf.com/..tokenExpiresAt')
  ).toBeFalsy();
  expect(
    await AsyncStorage.getItem('auth.https://asdf.com/..oauthToken')
  ).toBeFalsy();
  expect(jest.getTimerCount()).toBe(0);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});
