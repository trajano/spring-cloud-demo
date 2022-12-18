import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock-jest';
import React, { useState } from 'react';
import { AppState,  Pressable, Text } from 'react-native';
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
  await waitFor(()=> expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED"));
});
it("Sign In", async () => {
  function MyComponent() {
    const { authState, login } = useAuth();
    return (<>
      <Text testID='hello'>{authState}</Text>
      <Pressable testID='login' onPress={() => login({ user: "test" })} ><Text>Login</Text></Pressable>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { body: { ok: true } })
  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  act(() => jest.runAllTicks());
  expect(getByTestId("hello")).toHaveTextContent("2");
  fetchMock.post("http://asdf.com/auth", { body: { access_token: "accessToken", refresh_token: "RefreshToken", token_type: "Bearer", expires_in: 600 } as OAuthToken });
  await act(() => fireEvent.press(getByTestId("login")));
  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("1"));
  ;
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
