import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock-jest';
import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import { AuthenticationClientError } from '../AuthenticationClientError';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { buildSimpleEndpointConfiguration } from '../buildSimpleEndpointConfiguration';
import type { OAuthToken } from '../OAuthToken';
import { useAuth } from '../useAuth';
import { AuthProvider } from './AuthProvider';
let fetchConfigResponse: (new () => Response) | undefined;
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  fetchConfigResponse = fetchMock.config.Response;
  AppState.currentState = "active";
  AsyncStorage.clear();
})
afterEach(cleanup);
afterEach(() => {
  fetchMock.mockReset();
  fetchMock.config.Response = fetchConfigResponse;
  jest.useRealTimers();
  AppState.currentState = 'unknown'
})

it("AppState is active", () => {
  expect(AppState.currentState).toBe("active");
})
it("AsyncStorage works", async () => {
  await AsyncStorage.setItem("A", "B");
  const a = await AsyncStorage.getItem("A");
  expect(a).toBe("B");
  const c = await AsyncStorage.getItem("C");
  expect(c).toBeNull();
})

describe("with component", () => {
  function MyComponent({ notifications, onLoginFailure }: { notifications: () => void, onLoginFailure?: (e: unknown) => void }) {
    const { authState, login, logout, tokenRefreshable, subscribe } = useAuth();
    const [loginFailure, setLoginFailure] = useState<unknown>();
    const handleLogin = useMemo(() => async function handleLogin() {
      try {
        await login({ user: "test" });
      } catch (e: unknown) {
        setLoginFailure(e);
        onLoginFailure && onLoginFailure(e);
      }
    }, [])
    const handleLogout = useMemo(() => () => logout(), [])
    useEffect(() => subscribe(notifications), []);

    return (<>
      <Text testID='authState'>{AuthState[authState]}</Text>
      <Text testID='tokenRefreshable'>{tokenRefreshable ? "tokenRefreshable" : ""}</Text>
      <Text testID='loginFailure'>{loginFailure ? "loginFailure" : ""}</Text>
      <Pressable testID='login' onPress={handleLogin} ><Text>Login</Text></Pressable>
      <Pressable testID='logout' onPress={handleLogout} ><Text>Logout</Text></Pressable>
    </>)
  }

  it("UNAUTHENTICATED", async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    fetchMock.get("http://asdf.com/ping", { ok: true })
    const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
    expect(getByTestId("authState")).toHaveTextContent("INITIAL");
    await waitFor(() => expect(getByTestId("tokenRefreshable")).toHaveTextContent("tokenRefreshable"));
    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
  });
  it("login logout", async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
    fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
      .post("http://asdf.com/auth", { body: freshAccessToken })
      .post("http://asdf.com/logout", { body: { ok: true } });
    const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)

    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    act(() => { fireEvent.press(getByTestId("login")) });

    await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
    expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
    expect(getByTestId("authState")).toHaveTextContent("AUTHENTICATED");

    expect(await AsyncStorage.getItem('auth.http://asdf.com/..oauthToken')).toBe(JSON.stringify(freshAccessToken));
    const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string)
    // give at least a second of slack
    expect(tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 600000 - 1000)

    act(() => { fireEvent.press(getByTestId("logout")) });
    await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedOut" } as Partial<AuthEvent>)))
    expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>))
    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0)
  });

  it("Failed login", async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const onLoginFailure = jest.fn() as jest.Mock<(e: unknown) => void>;
    fetchMock
      .get("http://asdf.com/ping", { body: { ok: true } })
      .post("http://asdf.com/auth", { status: 401, body: { error: "authentication_failure" } });

    const { getByTestId } = render(
      <AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}>
        <MyComponent notifications={notifications} onLoginFailure={onLoginFailure} />
      </AuthProvider>)
    expect(getByTestId("authState")).toHaveTextContent("INITIAL");
    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    expect(getByTestId("loginFailure")).toHaveTextContent("");

    act(() => { fireEvent.press(getByTestId("login")) });
    await waitFor(() => { expect(getByTestId("loginFailure")).toHaveTextContent("loginFailure"); })
    expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED");
    expect(onLoginFailure).toBeCalledTimes(1)
    expect(onLoginFailure).toBeCalledWith(new Error("HTTP Error 401"))
    const failedCall = onLoginFailure.mock.calls[0][0];
    expect(failedCall instanceof AuthenticationClientError).toBeTruthy();
    expect(failedCall instanceof AuthenticationClientError && failedCall.isUnauthorized()).toBeTruthy();

  });


  it("Failed login 500", async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const onLoginFailure = jest.fn() as jest.Mock<(e: unknown) => void>;
    fetchMock
      .get("http://asdf.com/ping", { body: { ok: true } })
      .post("http://asdf.com/auth", { status: 500, body: { error: "server_error" } });

    const { getByTestId } = render(
      <AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}>
        <MyComponent notifications={notifications} onLoginFailure={onLoginFailure} />
      </AuthProvider>)
    expect(getByTestId("authState")).toHaveTextContent("INITIAL");
    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    expect(getByTestId("loginFailure")).toHaveTextContent("");

    act(() => { fireEvent.press(getByTestId("login")) });
    await waitFor(() => { expect(getByTestId("loginFailure")).toHaveTextContent("loginFailure"); })
    expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED");
    expect(onLoginFailure).toBeCalledTimes(1)
    expect(onLoginFailure).toBeCalledWith(new Error("HTTP Error 500"))
    const failedCall = onLoginFailure.mock.calls[0][0];
    expect(failedCall instanceof AuthenticationClientError).toBeTruthy();
    expect(failedCall instanceof AuthenticationClientError && failedCall.isUnauthorized()).toBeFalsy();

  });


  it("Invalid base URL", async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    fetchMock.get("http://asdf.com/ping", { ok: true })
    try {
      render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com")}><MyComponent notifications={notifications} /></AuthProvider>);
      fail("should not get here")
    } catch (e) {
      expect(e).toStrictEqual(new Error("baseUrl=http://asdf.com should end with a '/'"))
    }

  });

  it("login failed logout", async () => {
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
    fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
      .post("http://asdf.com/auth", { body: freshAccessToken })
    const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)

    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    act(() => { fireEvent.press(getByTestId("login")) });

    await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
    expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
    expect(getByTestId("authState")).toHaveTextContent("AUTHENTICATED");

    expect(await AsyncStorage.getItem('auth.http://asdf.com/..oauthToken')).toBe(JSON.stringify(freshAccessToken));
    const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string)
    // give at least a second of slack
    expect(tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 600000 - 1000)

    fetchMock.config.Response = Response;
    fetchMock.post("http://asdf.com/logout", Response.error());

    act(() => { fireEvent.press(getByTestId("logout")) });
    await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedOut" } as Partial<AuthEvent>)))
    expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>))
    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0)
  });

  it("just logout without login", async () => {
    fetchMock.config.Response = Response;
    const notifications = jest.fn() as jest.Mock<() => void>;
    const freshAccessToken: OAuthToken = { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
    fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
      .post("http://asdf.com/auth", { body: freshAccessToken })
      .post("http://asdf.com/logout", Response.error());
    const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)

    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    act(() => { fireEvent.press(getByTestId("logout")) });
    await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedOut" } as Partial<AuthEvent>)))
    expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>))
    await waitFor(() => expect(getByTestId("authState")).toHaveTextContent("UNAUTHENTICATED"));
    expect(await AsyncStorage.getAllKeys()).toHaveLength(0)
  });

});
