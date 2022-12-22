import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock';
import React, { useEffect, useMemo } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { buildSimpleEndpointConfiguration } from '../buildSimpleEndpointConfiguration';
import type { OAuthToken } from '../OAuthToken';
import { useAuth } from '../useAuth';
import { AuthProvider } from './AuthProvider';

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
  const { authState, login, accessTokenExpiresOn, accessToken, authorization, backendReachable: tokenRefreshable, subscribe } = useAuth();
  useEffect(() => subscribe(notifications), []);
  const doLogin = useMemo(() => async function doLogin() {
    return login({ user: "test" });
  }, [])
  return (<>
    <Text testID='hello'>{AuthState[authState]}</Text>
    <Text testID='accessToken'>{accessToken}</Text>
    <Text testID='authorization'>{authorization}</Text>
    <Text testID='tokenRefreshable'>{tokenRefreshable ? "tokenRefreshable" : ""}</Text>
    <Text testID='accessTokenExpiresOn'>{accessTokenExpiresOn?.toISOString()}</Text>
    <Pressable onPress={doLogin}><Text testID='login'>Login</Text></Pressable>
  </>)
}


it("Refresh two times", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", new Promise(res => setTimeout(res, 100, { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
    .postOnce("http://asdf.com/refresh", new Promise(res => setTimeout(res, 100, { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>)));
  notifications.mockClear();

  act(() => { fireEvent.press(getByTestId("login")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  notifications.mockClear();

  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string);
  act(() => jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000));
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.AUTHENTICATED } as Partial<AuthEvent>))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("REFRESHING"));
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));
  await waitFor(() => expect(getByTestId("accessToken")).toHaveTextContent("newAccessToken"));


  // do second refresh
  fetchMock
    .postOnce("http://asdf.com/refresh", { body: { access_token: "newAccessTokenPartTwo", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { overwriteRoutes: true })
  act(() => jest.runAllTimers());
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.AUTHENTICATED } as Partial<AuthEvent>)))
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Refreshing", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>)))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("REFRESHING"));
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", "accessToken": "newAccessTokenPartTwo" } as Partial<AuthEvent>)))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));
  await waitFor(() => expect(getByTestId("accessToken")).toHaveTextContent("newAccessTokenPartTwo"));
  await waitFor(() => expect(getByTestId("authorization")).toHaveTextContent("Bearer newAccessTokenPartTwo"));

  expect(jest.getTimerCount()).toBe(1)
  unmount();
  expect(jest.getTimerCount()).toBe(0)

})

it("Refresh 500 then successful", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", new Promise(res => setTimeout(res, 100, { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })));

  fetchMock
    .postOnce("http://asdf.com/refresh", { status: 500, body: { error: "server_error" } })

  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>)));
  notifications.mockClear();

  act(() => { fireEvent.press(getByTestId("login")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  notifications.mockClear();

  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string);
  act(() => jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000));
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.AUTHENTICATED } as Partial<AuthEvent>))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("REFRESHING"));
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("BACKEND_FAILURE"));

  // do second refresh
  fetchMock
    .postOnce("http://asdf.com/refresh", { body: { access_token: "newAccessTokenPartTwo", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { overwriteRoutes: true })
  act(() => jest.runAllTimers());
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.AUTHENTICATED } as Partial<AuthEvent>)))
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Refreshing", authState: AuthState.NEEDS_REFRESH } as Partial<AuthEvent>)))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("REFRESHING"));
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", "accessToken": "newAccessTokenPartTwo" } as Partial<AuthEvent>)))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));

  expect(jest.getTimerCount()).toBe(1)
  unmount();
  expect(jest.getTimerCount()).toBe(0)

})

it("Refresh fail with 401", async () => {
  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/auth", new Promise(res => setTimeout(res, 100, { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })));

  fetchMock
    .postOnce("http://asdf.com/refresh", { status: 401, body: { error: "unauthorized_client" } })

  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Unauthenticated" } as Partial<AuthEvent>)));
  notifications.mockClear();

  act(() => { fireEvent.press(getByTestId("login")) });
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "LoggedIn", accessToken: "freshAccessToken" } as Partial<AuthEvent>)))
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "freshAccessToken" } as Partial<AuthEvent>))
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  notifications.mockClear();

  const tokenExpiresAt = new Date(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt') as string);
  act(() => jest.advanceTimersByTime(tokenExpiresAt.getTime() - Date.now() - 10000));
  expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration", authState: AuthState.AUTHENTICATED } as Partial<AuthEvent>))
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("REFRESHING"));
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED"));

  expect(await AsyncStorage.getItem('auth.http://asdf.com/..tokenExpiresAt')).toBeFalsy();
  expect(await AsyncStorage.getItem('auth.http://asdf.com/..oauthToken')).toBeFalsy();
  expect(jest.getTimerCount()).toBe(0)
  unmount();
  expect(jest.getTimerCount()).toBe(0)

})

