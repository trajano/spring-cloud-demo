import '@testing-library/jest-native/extend-expect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { addMilliseconds } from 'date-fns';
import fetchMock from 'fetch-mock';
import React, { useEffect } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import type { AuthEvent } from './AuthEvent';
import { AuthProvider } from './AuthProvider';
import { AuthState } from './AuthState';
import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
import type { OAuthToken } from './OAuthToken';
import { useAuth } from './useAuth';

const specimenInstant = new Date("2022-11-11T12:00:00Z")
let globalFetch: typeof fetch;
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(specimenInstant);
  AppState.currentState = "active";
  AsyncStorage.clear();
  globalFetch = global.fetch;
  global.fetch = fetchMock.sandbox() as unknown as typeof fetch
})
afterEach(cleanup);
afterEach(() => {
  fetchMock.reset();
  global.fetch = globalFetch;
  jest.useRealTimers();
  AppState.currentState = 'unknown'
})

function MyComponent({ notifications }: { notifications: () => void }) {
  const { authState, login, accessTokenExpiresOn, accessToken, tokenRefreshable, subscribe } = useAuth();
  useEffect(() => subscribe(notifications), []);
  return (<>
    <Text testID='hello'>{AuthState[authState]}</Text>
    <Text testID='accessToken'>{accessToken}</Text>
    <Text testID='tokenRefreshable'>{tokenRefreshable ? "tokenRefreshable" : ""}</Text>
    <Text testID='accessTokenExpiresOn'>{accessTokenExpiresOn?.toISOString()}</Text>
    <Pressable onPress={() => login({ user: "test" })} ><Text testID='login'>Login</Text></Pressable>
  </>)
}

it("Refresh", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", new Promise(res => setTimeout(res, 100, { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
    .post("http://asdf.com/refresh", new Promise(res => setTimeout(res, 100, { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>)));
  notifications.mockClear();

  act(() => { fireEvent.press(getByTestId("login")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  notifications.mockClear();

  // this should not trigger a state change
  jest.advanceTimersByTime(addMilliseconds(specimenInstant, 59999).getTime() - Date.now());
  expect(notifications).toBeCalledTimes(0);
  act(() => jest.advanceTimersByTime(1));
  expect(notifications).toBeCalledTimes(1);
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "CheckRefresh", authState: AuthState.AUTHENTICATED } as Partial<AuthEvent>))
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  expect(new Date()).toStrictEqual(new Date("2022-11-11T12:01:00.000Z"))

  act(() => jest.advanceTimersByTime(60000));
  expect(notifications).toBeCalledTimes(2);
  expect(new Date()).toStrictEqual(new Date("2022-11-11T12:02:00.000Z"))

  // slept for 5 minutes but should only notify once
  act(() => jest.advanceTimersByTime(60000 * 5));
  expect(notifications).toBeCalledTimes(3);
  expect(new Date()).toStrictEqual(new Date("2022-11-11T12:07:00.000Z"))

  act(() => jest.advanceTimersByTime(60000));
  expect(notifications).toBeCalledTimes(4);
  expect(new Date()).toStrictEqual(new Date("2022-11-11T12:08:00.000Z"))

  // advance to the expiration time minus 10 seconds due to time before refresh minus one millisecond
  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string);
  act(() => jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000 - 1));
  expect(notifications).toBeCalledTimes(5);
  notifications.mockClear();

  act(() => jest.advanceTimersByTime(1));
  expect(notifications).toBeCalledTimes(3);
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>))
  expect(new Date()).toStrictEqual(new Date(tokenExpiresAt.getTime() - 10000));
  expect(getByTestId("hello")).toHaveTextContent("NEEDS_REFRESH");
  notifications.mockClear();

  // wait for advance to wait for the fetch for refresh
  //act(() => jest.advanceTimersByTime(200));

  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Refreshing",
  })));
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Authenticated",
    "reason": "Refreshed",
    "accessToken": "newAccessToken"
  })));
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  notifications.mockClear()

  // do second refresh
  act(() => jest.runAllTimers());
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>))
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Refreshing",
  })));
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Authenticated",
    "reason": "Refreshed",
    "accessToken": "newAccessToken"
  })));
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");

  expect(jest.getTimerCount()).toBe(1)
  unmount();
  expect(jest.getTimerCount()).toBe(0)

})

it("Refresh fail with 500", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", new Promise(res => setTimeout(res, 100, { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
    .post("http://asdf.com/refresh", new Promise(res => setTimeout(res, 100, { status: 500, body: { error: "server_error" } })))
  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>)));
  notifications.mockClear();

  act(() => { fireEvent.press(getByTestId("login")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken", } as Partial<AuthEvent>))
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  notifications.mockClear();
  expect(jest.getTimerCount()).toBe(1);
  console.log({ b4: new Date() })
  act(() => jest.runAllTimers());
  console.log({ after: new Date() })
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>))

  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string);
  expect(new Date()).toStrictEqual(new Date(tokenExpiresAt.getTime() - 10000))
  expect(getByTestId("hello")).toHaveTextContent("NEEDS_REFRESH");
  notifications.mockClear();

  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Refreshing",
  })));
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "TokenExpiration",
    "reason": "HTTP Error 500",
  })));
  expect(getByTestId("hello")).toHaveTextContent("BACKEND_FAILURE");
  notifications.mockClear()

  // do second refresh
  fetchMock
    .post("http://asdf.com/refresh", new Promise(res => setTimeout(res, 100, { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })), { overwriteRoutes: true })

  act(() => jest.runOnlyPendingTimers());
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>))
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Refreshing",
  })));
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Authenticated",
    "reason": "Refreshed",
    "accessToken": "newAccessToken"
  })));
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");

  expect(jest.getTimerCount()).toBe(1)
  unmount();
  expect(jest.getTimerCount()).toBe(0)

})

it("Refresh fail with 401", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", new Promise(res => setTimeout(res, 100, { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
    .post("http://asdf.com/refresh", new Promise(res => setTimeout(res, 100, { status: 401, body: { error: "unauthorized" } })))
  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>)));
  notifications.mockClear();

  act(() => { fireEvent.press(getByTestId("login")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  expect(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt')).toBeTruthy();
  notifications.mockClear();
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  act(() => jest.runAllTimers());
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>))
  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string);
  expect(new Date()).toStrictEqual(new Date(tokenExpiresAt.getTime() - 10000))
  expect(getByTestId("hello")).toHaveTextContent("NEEDS_REFRESH");
  notifications.mockClear();

  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Refreshing",
  })));
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({
    "type": "Unauthenticated",
    "reason": "HTTP Error 401",
  })));
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");
  expect(jest.getTimerCount()).toBe(0)
  unmount();

})
