import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock-jest';
import React, { useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { AuthenticationClientError } from './AuthenticationClientError';
import type { AuthEvent } from './AuthEvent';
import { AuthProvider } from './AuthProvider';
import { AuthState } from './AuthState';
import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
import type { OAuthToken } from './OAuthToken';
import { useAuth } from './useAuth';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  AppState.currentState = "active";
  AsyncStorage.clear();
})
afterEach(cleanup);
afterEach(() => {
  fetchMock.mockReset();
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
it("UNAUTHENTICATED", async () => {
  function MyComponent() {
    const { authState } = useAuth();
    return (<>
      <Text testID='hello'>{AuthState[authState]}</Text>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { ok: true })
  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED"));
});
it("login logout", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  function MyComponent() {
    const { authState, login, logout, tokenRefreshable, subscribe } = useAuth();
    useEffect(() => subscribe(notifications), []);
    return (<>
      <Text testID='hello'>{authState}</Text>
      <Text testID='tokenRefreshable'>{tokenRefreshable ? "tokenRefreshable" : ""}</Text>
      <Pressable testID='login' onPress={() => login({ user: "test" })} ><Text>Login</Text></Pressable>
      <Pressable testID='logout' onPress={() => logout()} ><Text>Logout</Text></Pressable>
    </>)
  }
  const freshAccessToken: OAuthToken = { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
  fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", { body: freshAccessToken })
    .post("http://asdf.com/logout", { body: { ok: true } });
  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  await waitFor(() => expect(getByTestId("tokenRefreshable")).toHaveTextContent("tokenRefreshable"));
  expect(getByTestId("hello")).toHaveTextContent("0");

  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("2"));

  act(() => { fireEvent.press(getByTestId("login")) });

  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken", } as Partial<AuthEvent>))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("1"));

  expect(await AsyncStorage.getItem('auth.http://asdf.com/..oauthToken')).toBe(JSON.stringify(freshAccessToken));
  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string)
  // give at least a second of slack
  expect(tokenExpiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 600000 - 1000)

  act(() => { fireEvent.press(getByTestId("logout")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedOut" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("2"));
  expect(await AsyncStorage.getAllKeys()).toHaveLength(0)
});

it("Failed login", async () => {
  jest.setSystemTime(new Date("2022-11-11T12:00:00Z"));

  function MyComponent() {
    const { authState, login, accessTokenExpiresOn, accessToken } = useAuth();
    const [loginFailure, setLoginFailure] = useState(false);
    async function handleLogin() {
      try {
        await login({ user: "test" });
      } catch (e: unknown) {
        if (typeof e === "object" && (e as AuthenticationClientError).isAuthenticationClientError && e instanceof AuthenticationClientError) {
          setLoginFailure(e.isUnauthorized());
        }

      }
    }
    return (<>
      <Text testID='hello'>{AuthState[authState]}</Text>
      <Text testID='loginFailure'>{loginFailure ? "Login Failure" : ""}</Text>
      <Text testID='accessToken'>{accessToken}</Text>
      <Text testID='accessTokenExpiresOn'>{accessTokenExpiresOn?.toISOString()}</Text>
      <Pressable testID='login' onPress={handleLogin}><Text>Login</Text></Pressable>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
  fetchMock.post("http://asdf.com/auth", { status: 401, body: { error: "authentication_failure" } }, { delay: 100 });
  fetchMock.post("http://asdf.com/refresh", { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { delay: 100 });

  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  expect(getByTestId("hello")).toHaveTextContent("INITIAL");
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED"));
  expect(getByTestId("loginFailure")).toHaveTextContent("");

  await act(() => fireEvent.press(getByTestId("login")));
  await act(() => jest.advanceTimersByTime(100));
  await waitFor(() => { expect(getByTestId("loginFailure")).toHaveTextContent("Login Failure"); })
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");

});

it("Invalid base URL", async () => {
  function MyComponent() {
    return <View></View>
  }
  fetchMock.get("http://asdf.com/ping", { ok: true })
  try {
    render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com")}><MyComponent /></AuthProvider>);
    fail("should not get here")
  } catch (e) {
    expect(e).toStrictEqual(new Error("baseUrl=http://asdf.com should end with a '/'"))
  }

});

