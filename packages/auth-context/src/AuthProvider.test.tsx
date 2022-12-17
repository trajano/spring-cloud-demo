import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock-jest';
import { add } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import { AuthenticationClientError } from './AuthenticationClientError';
import { AuthProvider } from './AuthProvider';
import { AuthState } from './AuthState';
import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
import type { OAuthToken } from './OAuthToken';
import { useAuth } from './useAuth';
import type { AuthenticatedEvent, AuthEvent } from './AuthEvent';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  AppState.currentState = "active";
})
afterEach(cleanup);

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
it("Sign In", async () => {
  function MyComponent() {
    const { authState, tokenRefreshable, login } = useAuth();
    return (<>
      <Text testID='hello'>{authState}</Text>
      <Text testID='tokenRefreshable'>{tokenRefreshable ? "tokenRefreshable" : ""}</Text>
      <Pressable testID='login' onPress={() => login({ user: "test" })} ><Text>Login</Text></Pressable>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
  const startInstant = Date.now();
  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  act(() => jest.runAllTicks());
  await waitFor(() => expect(getByTestId("tokenRefreshable")).toHaveTextContent("tokenRefreshable"));
  expect(getByTestId("hello")).toHaveTextContent("2");
  fetchMock.post("http://asdf.com/auth", { body: { access_token: "accessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { delay: 100 });
  await act(() => fireEvent.press(getByTestId("login")));
  // There's some animation lag after pressing login

  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("1"));
  const animationTime = Date.now() - startInstant - 100;
  expect(animationTime).toBeGreaterThanOrEqual(100);
});

it("Fail Refresh with error 500", async () => {
  jest.setSystemTime(new Date("2022-11-11T12:00:00Z"));
  const notifications = jest.fn();
  function MyComponent() {
    const { authState, login, accessTokenExpiresOn, accessToken, tokenRefreshable, subscribe } = useAuth();
    useEffect(() => subscribe(notifications), []);
    return (<>
      <Text testID='hello'>{AuthState[authState]}</Text>
      <Text testID='accessToken'>{accessToken}</Text>
      <Text testID='tokenRefreshable'>{tokenRefreshable ? "tokenRefreshable" : ""}</Text>
      <Text testID='accessTokenExpiresOn'>{accessTokenExpiresOn?.toISOString()}</Text>
      <Pressable testID='login' onPress={() => login({ user: "test" })} ><Text>Login</Text></Pressable>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
  fetchMock.post("http://asdf.com/auth", { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { delay: 100 });
  fetchMock.post("http://asdf.com/refresh", { status: 500, body: { error: "server_error" } }, { delay: 200 });

  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  const startInstant = Date.now();
  expect(notifications).toHaveBeenNthCalledWith(1, { "authState": 0, "reason": "Triggered by a change to tokenRefreshable=false authState: INITIAL", "type": "CheckRefresh" });
  expect(notifications).toHaveBeenNthCalledWith(2, { "authState": 0, "reason": "Triggered by a change to tokenRefreshable=false accessTokenExpired: true lastCheckTime: 2022-11-11T12:00:00.000Z", "type": "CheckRefresh" });
  expect(notifications).toHaveBeenNthCalledWith(3, { "authState": 2, "reason": "Triggered by a change to tokenRefreshable=false authState: UNAUTHENTICATED", "type": "CheckRefresh" });
  act(() => jest.runAllTicks());
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");
  await waitFor(() => expect(notifications).toHaveBeenNthCalledWith(4, { "authState": 2, "reason": "Triggered by a change to tokenRefreshable=true authState: UNAUTHENTICATED", "type": "CheckRefresh" }));
  await waitFor(() => expect(notifications).toHaveBeenNthCalledWith(5, { "authState": 2, "reason": "Triggered by a change to tokenRefreshable=true accessTokenExpired: true lastCheckTime: 2022-11-11T12:00:00.000Z", "type": "CheckRefresh" }));
  expect(notifications).toHaveBeenCalledTimes(5)
  expect(getByTestId("tokenRefreshable")).toHaveTextContent("tokenRefreshable");
  await act(() => fireEvent.press(getByTestId("login")));

  // There's some animation lag after pressing login
  const animationTime = Date.now() - startInstant - 100;
  expect(animationTime).toBeGreaterThanOrEqual(100);
  const firstTokenCreatedAt = Date.now();

  await waitFor(() => expect(notifications).toHaveBeenNthCalledWith(6, { "authState": 1, "reason": "Triggered by a change to tokenRefreshable=true authState: AUTHENTICATED", "type": "CheckRefresh" }));
  await waitFor(() => expect(notifications).toHaveBeenNthCalledWith(7, { "authState": 1, "reason": "Triggered by a change to tokenRefreshable=true accessTokenExpired: false lastCheckTime: 2022-11-11T12:00:00.000Z", "type": "CheckRefresh" }));
  expect(notifications).toHaveBeenNthCalledWith(9, expect.objectContaining({
    "type": "LoggedIn",
    "authState": AuthState.UNAUTHENTICATED,
    "accessToken": "freshAccessToken"
  }));
  expect(notifications).toHaveBeenNthCalledWith(10, expect.objectContaining({
    "type": "Authenticated",
    "authState": AuthState.UNAUTHENTICATED,
    "accessToken": "freshAccessToken"
  }));
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  expect(getByTestId("accessTokenExpiresOn")).toHaveTextContent(add(firstTokenCreatedAt, { seconds: 600 }).toISOString());
  expect(notifications).toBeCalledTimes(10);

  // before the 60 second check tick
  act(() => jest.advanceTimersByTime(59999));
  expect(notifications).toBeCalledTimes(10);
  act(() => jest.advanceTimersByTime(1));
  expect(notifications).toBeCalledTimes(11);
  expect(notifications).toHaveBeenNthCalledWith(11, expect.objectContaining({
    "type": "CheckRefresh",
    "authState": AuthState.AUTHENTICATED,
    "reason": expect.stringContaining("Triggered by a change to tokenRefreshable=true accessTokenExpired: false lastCheckTime:")
  }));
  expect(Date.now()).toBe(firstTokenCreatedAt + 60000);

  expect(notifications).toBeCalledTimes(11);
  act(() => jest.advanceTimersByTime(60000));
  expect(notifications).toBeCalledTimes(12);
  act(() => jest.advanceTimersByTime(60000));
  expect(notifications).toBeCalledTimes(13);
  act(() => jest.advanceTimersByTime(60000));
  expect(notifications).toBeCalledTimes(14);
  act(() => jest.advanceTimersByTime(60000));
  expect(notifications).toBeCalledTimes(15);

  // pretend the app went to sleep and woke up after a few mintues

  act(() => jest.advanceTimersByTime(60000 * 4));
  expect(notifications).toBeCalledTimes(16);

  // About to hit early refresh
  act(() => jest.advanceTimersByTime(49999));
  expect(notifications).toBeCalledTimes(16);

  act(() => jest.advanceTimersByTime(1));
  expect(notifications).toBeCalledTimes(19);
  expect(notifications).toHaveBeenNthCalledWith(17, expect.objectContaining({
    "type": "CheckRefresh",
    "authState": AuthState.AUTHENTICATED,
    "reason": expect.stringContaining("Triggered by a change to tokenRefreshable=true accessTokenExpired: true lastCheckTime:")
  }));
  expect(notifications).toHaveBeenNthCalledWith(18, expect.objectContaining({
    "type": "CheckRefresh",
    "authState": AuthState.NEEDS_REFRESH,
  }));
  expect(notifications).toHaveBeenNthCalledWith(19, expect.objectContaining({
    "type": "TokenExpiration",
    "authState": AuthState.NEEDS_REFRESH,
  }));
  expect(getByTestId("hello")).toHaveTextContent("NEEDS_REFRESH");

  // clear the mock history
  notifications.mockClear();
  await waitFor(() => expect(notifications.mock.calls.length).toBeGreaterThan(0));

  expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Refreshing",
    "authState": AuthState.NEEDS_REFRESH,
  }));
  await waitFor(() => expect(notifications.mock.calls.length).toBeGreaterThan(2));
  expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "authState": AuthState.BACKEND_FAILURE,
  }));
  expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    type: "TokenExpiration",
    "authState": AuthState.NEEDS_REFRESH,
  }));


  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("BACKEND_FAILURE");
  notifications.mockClear();
  fetchMock.post("http://asdf.com/auth", { body: { access_token: "accessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { delay: 100, overwriteRoutes: true });
  act(() => jest.advanceTimersByTime(60000))
  // TODO handle this scenario, it should refresh again
  // await waitFor(() => expect(notifications.mock.calls.length).toBeGreaterThan(0));
  // console.log(notifications.mock.calls)
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
  act(() => jest.runAllTicks());
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");
  expect(getByTestId("loginFailure")).toHaveTextContent("");

  await act(() => fireEvent.press(getByTestId("login")));
  await act(() => jest.advanceTimersByTime(100));
  await waitFor(() => { expect(getByTestId("loginFailure")).toHaveTextContent("Login Failure"); })
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");

});

afterEach(() => {
  fetchMock.mockReset();
  jest.useRealTimers();
  AppState.currentState = 'unknown'
})
