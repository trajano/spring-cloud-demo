import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock-jest';
import React, { useEffect, useState } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import { AuthenticationClientError } from './AuthenticationClientError';
import { AuthProvider } from './AuthProvider';
import { AuthState } from './AuthState';
import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
import type { OAuthToken } from './OAuthToken';
import { useAuth } from './useAuth';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  AppState.currentState = "active";
})
afterEach(cleanup);

it("Refresh", async () => {
  jest.setSystemTime(new Date("2022-11-11T12:00:00Z"));
  const notifier = jest.fn();
  function MyComponent() {
    const { authState, login, accessTokenExpiresOn, accessToken, subscribe } = useAuth();
    useEffect(() => subscribe(notifier), []);
    return (<>
      <Text testID='hello'>{AuthState[authState]}</Text>
      <Text testID='accessToken'>{accessToken}</Text>
      <Text testID='accessTokenExpiresOn'>{accessTokenExpiresOn?.toISOString()}</Text>
      <Pressable testID='login' onPress={() => login({ user: "test" })} ><Text>Login</Text></Pressable>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
  fetchMock.post("http://asdf.com/auth", { body: { access_token: "freshAccessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { delay: 100 });
  fetchMock.post("http://asdf.com/refresh", { body: { access_token: "newAccessToken", refresh_token: "NotThePreviousRefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken }, { delay: 100 });

  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  notifier.mockClear();
  await waitFor(() => expect(notifier).toBeCalledWith(expect.objectContaining({
    type: "Unauthenticated",
    reason: "No token stored"
  })));
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED"));
  // console.log(notifier.mock.calls)
  // await act(() => fireEvent.press(getByTestId("login")));
  // await act(() => jest.advanceTimersByTime(600000));
  // await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));

});

afterEach(() => {
  fetchMock.mockReset();
  jest.useRealTimers();
  AppState.currentState = 'unknown'
})
