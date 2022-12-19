import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { addMilliseconds, subMilliseconds } from 'date-fns';
import fetchMock from 'fetch-mock';
import React, { useEffect } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import { AuthStore } from '../AuthStore';
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

it("Check storage", async () => {
  const oldAccessToken: OAuthToken = { access_token: "oldAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
  await AsyncStorage.setItem('auth.http://asdf.com/..oauthToken', JSON.stringify(oldAccessToken));
  await AsyncStorage.setItem('auth.http://asdf.com/..tokenExpiresAt', addMilliseconds(specimenInstant, 600000).toISOString());
  const authStore = new AuthStore("auth", "http://asdf.com/");
  expect(await authStore.isExpired()).toBeFalsy();
});

it("Check storage expired", async () => {
  const oldAccessToken: OAuthToken = { access_token: "oldAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
  await AsyncStorage.setItem('auth.http://asdf.com/..oauthToken', JSON.stringify(oldAccessToken));
  await AsyncStorage.setItem('auth.http://asdf.com/..tokenExpiresAt', subMilliseconds(specimenInstant, 600000).toISOString());
  const authStore = new AuthStore("auth", "http://asdf.com/");
  expect(await authStore.isExpired()).toBeTruthy();
});

it("Restore saved not expired", async () => {
  const oldAccessToken: OAuthToken = { access_token: "oldAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
  await AsyncStorage.setItem('auth.http://asdf.com/..oauthToken', JSON.stringify(oldAccessToken));
  await AsyncStorage.setItem('auth.http://asdf.com/..tokenExpiresAt', addMilliseconds(specimenInstant, 600000).toISOString());


  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/refresh", new Promise(res => setTimeout(res, 100, { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })))
  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)

  // await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration" } as Partial<AuthEvent>)))
  // console.log(notifications.mock.calls)
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "Authenticated", accessToken: "oldAccessToken" } as Partial<AuthEvent>)))
  expect(getByTestId("accessToken")).toHaveTextContent("oldAccessToken");

  expect(jest.getTimerCount()).toBe(1)
  unmount();
  expect(jest.getTimerCount()).toBe(0)

})


it("Restore saved expired", async () => {
  const oldAccessToken: OAuthToken = { access_token: "oldAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 };
  await AsyncStorage.setItem('auth.http://asdf.com/..oauthToken', JSON.stringify(oldAccessToken));
  await AsyncStorage.setItem('auth.http://asdf.com/..tokenExpiresAt', subMilliseconds(specimenInstant, 600000).toISOString());

  const authStore = new AuthStore("auth", "http://asdf.com/");
  expect(await authStore.isExpired()).toBeTruthy();

  const notifications = jest.fn() as jest.Mock<() => void>;
  fetchMock
    .get("http://asdf.com/ping", { body: { ok: true } })
    .post("http://asdf.com/refresh", { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken })
  const { getByTestId, unmount } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent notifications={notifications} /></AuthProvider>)
  expect(getByTestId("hello")).toHaveTextContent("INITIAL")

  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({ type: "TokenExpiration" } as Partial<AuthEvent>)))
  await waitFor(() => expect(notifications).toHaveBeenCalledWith(expect.objectContaining({ type: "Refreshing" } as Partial<AuthEvent>)))
  await waitFor(() => expect(notifications).toHaveBeenLastCalledWith(expect.objectContaining({ type: "Authenticated" } as Partial<AuthEvent>)))
  expect(jest.getTimerCount()).toBe(1)
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));
  await waitFor(() => expect(notifications).toBeCalledWith(expect.objectContaining({ type: "TokenExpiration" } as Partial<AuthEvent>)))

  unmount();
  expect(jest.getTimerCount()).toBe(0)

})
