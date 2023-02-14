/** @jest-environment node */
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
import fetchMock from 'fetch-mock-jest';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text } from 'react-native';

import { AuthProvider } from './AuthProvider';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { AuthenticationClientError } from '../AuthenticationClientError';
import type { OAuthToken } from '../OAuthToken';
import { buildSimpleEndpointConfiguration } from '../buildSimpleEndpointConfiguration';
import { useAuth } from '../useAuth';
let fetchConfigResponse: (new () => Response) | undefined;
beforeEach(() => {
  fetchConfigResponse = fetchMock.config.Response;
  AppState.currentState = 'active';
  AsyncStorage.clear().catch(console.error);
});
afterEach(cleanup);
afterEach(() => {
  fetchMock.mockReset();
  fetchMock.config.Response = fetchConfigResponse;
  AppState.currentState = 'unknown';
});

it('AppState is active', () => {
  expect(AppState.currentState).toBe('active');
});
it('AsyncStorage works', async () => {
  await AsyncStorage.setItem('A', 'B');
  const a = await AsyncStorage.getItem('A');
  expect(a).toBe('B');
  const c = await AsyncStorage.getItem('C');
  expect(c).toBeNull();
});

describe('with component', () => {
  const MyComponent = ({
    notifications,
    onLoginFailure,
    onRender,
  }: {
    notifications: () => void;
    onLoginFailure?: (e: unknown) => void;
    onRender?: () => void;
  }) => {
    const {
      authState,
      loginAsync,
      logoutAsync,
      backendReachable,
      subscribe,
      forceCheckAuthStorageAsync: forceCheckAuthStorage,
    } = useAuth();
    const [loginFailure, setLoginFailure] = useState<unknown>();
    const handleLogin = useCallback(async () => {
      try {
        await loginAsync({ user: 'test' });
      } catch (e: unknown) {
        setLoginFailure(e);
        onLoginFailure?.(e);
      }
    }, [loginAsync, onLoginFailure]);
    const handleLogout = useCallback(() => logoutAsync(true), [logoutAsync]);
    useEffect(() => subscribe(notifications), [notifications, subscribe]);
    onRender?.();
    return (
      <>
        <Text testID="authState">{AuthState[authState]}</Text>
        <Text testID="tokenRefreshable">
          {backendReachable ? 'tokenRefreshable' : ''}
        </Text>
        <Text testID="loginFailure">{loginFailure ? 'loginFailure' : ''}</Text>
        <Pressable testID="login" onPress={handleLogin}>
          <Text>Login</Text>
        </Pressable>
        <Pressable testID="logout" onPress={handleLogout}>
          <Text>Logout</Text>
        </Pressable>
        <Pressable
          testID="forceCheckAuthStorage"
          onPress={forceCheckAuthStorage}
        >
          <Text>Force Check Auth Storage</Text>
        </Pressable>
      </>
    );
  };

  it('UNAUTHENTICATED', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    fetchMock.get('https://asdf.com/ping', { ok: true });
    const { unmount } = render(
      <AuthProvider
        defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
          'https://asdf.com/'
        )}
      >
        <MyComponent notifications={notifications} />
      </AuthProvider>
    );
    expect(screen.getByTestId('authState')).toHaveTextContent('INITIAL');
    await waitFor(() =>
      expect(screen.getByTestId('tokenRefreshable')).toHaveTextContent(
        'tokenRefreshable'
      )
    );
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    unmount();
  });

  it('login logout', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const onRender = jest.fn();
    const freshAccessToken: OAuthToken = {
      access_token: 'freshAccessToken',
      refresh_token: 'RefreshToken',
      token_type: 'Bearer',
      expires_in: 600,
    };
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', { body: freshAccessToken })
      .post('https://asdf.com/logout', { body: { ok: true } });
    const { unmount } = render(
      <AuthProvider
        defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
          'https://asdf.com/'
        )}
      >
        <MyComponent onRender={onRender} notifications={notifications} />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
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
    expect(screen.getByTestId('authState')).toHaveTextContent('AUTHENTICATED');

    expect(
      await AsyncStorage.getItem('auth.https://asdf.com/..oauthToken')
    ).toBe(JSON.stringify(freshAccessToken));

    const tokenExpiresAtFromStore = await AsyncStorage.getItem(
      'auth.https://asdf.com/..tokenExpiresAt'
    );
    expect(tokenExpiresAtFromStore).not.toBeNull();
    const tokenExpiresAt = new Date(tokenExpiresAtFromStore!);
    // give at least a second of slack
    expect(tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(
      Date.now() + 600000 - 1000
    );

    fireEvent.press(screen.getByTestId('logout'));
    await act(() => Promise.resolve());
    await waitFor(() =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LoggedOut' } as Partial<AuthEvent>)
      )
    );
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    );
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    unmount();
  });

  it('force Auth Storage check', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const onRender = jest.fn();
    const freshAccessToken: OAuthToken = {
      access_token: 'freshAccessToken',
      refresh_token: 'RefreshToken',
      token_type: 'Bearer',
      expires_in: 600,
    };
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', { body: freshAccessToken })
      .post('https://asdf.com/logout', { body: { ok: true } });
    const { unmount } = render(
      <AuthProvider
        defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
          'https://asdf.com/'
        )}
      >
        <MyComponent onRender={onRender} notifications={notifications} />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
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
    expect(screen.getByTestId('authState')).toHaveTextContent('AUTHENTICATED');

    expect(
      await AsyncStorage.getItem('auth.https://asdf.com/..oauthToken')
    ).toBe(JSON.stringify(freshAccessToken));
    const tokenExpiresAtFromStore = await AsyncStorage.getItem(
      'auth.https://asdf.com/..tokenExpiresAt'
    );
    expect(tokenExpiresAtFromStore).not.toBeNull();
    const tokenExpiresAt = new Date(tokenExpiresAtFromStore!);
    // give at least a second of slack
    expect(tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(
      Date.now() + 600000 - 1000
    );

    onRender.mockClear();
    fireEvent.press(screen.getByTestId('forceCheckAuthStorage'));
    expect(screen.getByTestId('authState')).toHaveTextContent('AUTHENTICATED');

    expect(onRender).toHaveBeenCalledTimes(0);
    unmount();
  });

  it('Failed login', async () => {
    const notifications = jest.fn<void, []>();
    const onLoginFailure = jest.fn<void, [e: unknown]>();
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', {
        status: 401,
        body: { error: 'authentication_failure' },
      });

    const { unmount } = render(
      <AuthProvider
        defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
          'https://asdf.com/'
        )}
      >
        <MyComponent
          notifications={notifications}
          onLoginFailure={onLoginFailure}
        />
      </AuthProvider>
    );
    expect(screen.getByTestId('authState')).toHaveTextContent('INITIAL');
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(screen.getByTestId('loginFailure')).toHaveTextContent('');

    fireEvent.press(screen.getByTestId('login'));
    await waitFor(() => {
      expect(screen.getByTestId('loginFailure')).toHaveTextContent(
        'loginFailure'
      );
    });
    expect(screen.getByTestId('authState')).toHaveTextContent(
      'UNAUTHENTICATED'
    );
    expect(onLoginFailure).toHaveBeenCalledTimes(1);
    expect(onLoginFailure).toHaveBeenCalledWith(new Error('HTTP Error 401'));
    const failedCall =
      onLoginFailure.mock.calls[0] && onLoginFailure.mock.calls[0][0];
    expect(failedCall instanceof AuthenticationClientError).toBeTruthy();
    expect(
      failedCall instanceof AuthenticationClientError &&
        failedCall.isUnauthorized()
    ).toBeTruthy();
    unmount();
  });

  it('Failed login 500', async () => {
    const notifications = jest.fn<void, []>();
    const onLoginFailure = jest.fn<void, [e: unknown]>();
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', {
        status: 500,
        body: { error: 'server_error' },
      });

    const { unmount } = render(
      <AuthProvider
        defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
          'https://asdf.com/'
        )}
      >
        <MyComponent
          notifications={notifications}
          onLoginFailure={onLoginFailure}
        />
      </AuthProvider>
    );
    expect(screen.getByTestId('authState')).toHaveTextContent('INITIAL');
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(screen.getByTestId('loginFailure')).toHaveTextContent('');

    fireEvent.press(screen.getByTestId('login'));
    await waitFor(() => {
      expect(screen.getByTestId('loginFailure')).toHaveTextContent(
        'loginFailure'
      );
    });
    expect(screen.getByTestId('authState')).toHaveTextContent(
      'UNAUTHENTICATED'
    );
    expect(onLoginFailure).toHaveBeenCalledTimes(1);
    expect(onLoginFailure).toHaveBeenCalledWith(new Error('HTTP Error 500'));
    const failedCall =
      onLoginFailure.mock.calls[0] && onLoginFailure.mock.calls[0][0];
    expect(failedCall instanceof AuthenticationClientError).toBeTruthy();
    expect(
      failedCall instanceof AuthenticationClientError &&
        failedCall.isUnauthorized()
    ).toBeFalsy();
    unmount();
  });

  it('Invalid base URL', () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    fetchMock.get('https://asdf.com/ping', { ok: true });
    expect(() => {
      render(
        <AuthProvider
          defaultEndpointConfiguration={buildSimpleEndpointConfiguration(
            'https://asdf.com'
          )}
        >
          <MyComponent notifications={notifications} />
        </AuthProvider>
      );
    }).toThrow(new Error("baseUrl=https://asdf.com should end with a '/'"));
  });

  it('login failed logout', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = {
      access_token: 'freshAccessToken',
      refresh_token: 'RefreshToken',
      token_type: 'Bearer',
      expires_in: 600,
    };
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', { body: freshAccessToken });
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
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
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
    expect(screen.getByTestId('authState')).toHaveTextContent('AUTHENTICATED');

    expect(
      await AsyncStorage.getItem('auth.https://asdf.com/..oauthToken')
    ).toBe(JSON.stringify(freshAccessToken));
    const tokenExpiresAtFromStore = await AsyncStorage.getItem(
      'auth.https://asdf.com/..tokenExpiresAt'
    );
    expect(tokenExpiresAtFromStore).not.toBeNull();
    const tokenExpiresAt = new Date(tokenExpiresAtFromStore!);
    // give at least a second of slack
    expect(tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(
      Date.now() + 600000 - 1000
    );

    fetchMock.post('https://asdf.com/logout', {
      body: 'safely ignore me',
      status: 500,
    });

    fireEvent.press(screen.getByTestId('logout'));
    await act(() => Promise.resolve());
    await waitFor(() =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LoggedOut' } as Partial<AuthEvent>)
      )
    );
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    );
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    unmount();
  });

  it('just logout without login', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = {
      access_token: 'freshAccessToken',
      refresh_token: 'RefreshToken',
      token_type: 'Bearer',
      expires_in: 600,
    };
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', { body: freshAccessToken })
      .post('https://asdf.com/logout', {
        ok: false,
        status: 0,
        type: 'error',
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
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    fireEvent.press(screen.getByTestId('logout'));
    await act(() => Promise.resolve());
    await waitFor(() =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LoggedOut' } as Partial<AuthEvent>)
      )
    );
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    );
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    unmount();
  });

  it('just logout without login with no error', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = {
      access_token: 'freshAccessToken',
      refresh_token: 'RefreshToken',
      token_type: 'Bearer',
      expires_in: 600,
    };
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', { body: freshAccessToken })
      .post('https://asdf.com/logout', { body: { ok: true } });
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
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    fireEvent.press(screen.getByTestId('logout'));
    await act(() => Promise.resolve());
    await waitFor(() =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LoggedOut' } as Partial<AuthEvent>)
      )
    );
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    );
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    unmount();
  });

  it('just logout without login with error', async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = {
      access_token: 'freshAccessToken',
      refresh_token: 'RefreshToken',
      token_type: 'Bearer',
      expires_in: 600,
    };
    fetchMock
      .get('https://asdf.com/ping', { body: { ok: true } })
      .post('https://asdf.com/auth', { body: freshAccessToken })
      .post('https://asdf.com/logout', {
        body: 'safely ignore me',
        status: 500,
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
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    fireEvent.press(screen.getByTestId('logout'));
    await act(() => Promise.resolve());
    await waitFor(() =>
      expect(notifications).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'LoggedOut' } as Partial<AuthEvent>)
      )
    );
    expect(notifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Unauthenticated' } as Partial<AuthEvent>)
    );
    await waitFor(() =>
      expect(screen.getByTestId('authState')).toHaveTextContent(
        'UNAUTHENTICATED'
      )
    );
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0);
    unmount();

    expect(
      (await fetch('https://asdf.com/logout', { method: 'post' })).status
    ).toBe(500);
    expect(
      (await fetch('https://asdf.com/logout', { method: 'post' })).ok
    ).toBe(false);
  });
});
