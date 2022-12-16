import AsyncStorage from '@react-native-async-storage/async-storage';
import '@testing-library/jest-native/extend-expect';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import fetchMock from 'fetch-mock-jest';
import React from 'react';
import { AppState, Button, Pressable, Text } from 'react-native';
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
it.skip("UNAUTHENTICATED", () => {
  function MyComponent() {
    const { authState } = useAuth();
    return (<>
      <Text testID='hello'>{AuthState[authState]}</Text>
    </>)
  }
  fetchMock.get("http://asdf.com/ping", { ok: true })
  const { getByTestId } = render(<AuthProvider defaultEndpointConfiguration={buildSimpleEndpointConfiguration("http://asdf.com/")}><MyComponent /></AuthProvider>)
  act(() => jest.runAllTicks());
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");
});
it.skip("Sign In", async () => {
  function MyComponent() {
    const { authState, login } = useAuth();
    return (<>
      <Text testID='hello'>{authState}</Text>
      <Pressable testID='login' onPress={() => login({ user: "test" })} ><Text>Login</Text></Pressable>
      <Button testID='loginButton' onPress={() => login({ user: "test" })} title="Login" />
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
it("Refresh", async () => {
  jest.setSystemTime(new Date("2022-11-11T12:00:00Z"));

  function MyComponent() {
    const { authState, login, accessTokenExpiresOn, accessToken } = useAuth();
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
  act(() => jest.runAllTicks());
  expect(getByTestId("hello")).toHaveTextContent("UNAUTHENTICATED");

  await act(() => fireEvent.press(getByTestId("login")));
  expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("accessTokenExpiresOn")).toHaveTextContent("2022-11-11T12:10:00.100Z");

  act(() => jest.advanceTimersByTime(600000));
  expect(new Date().toISOString()).toBe("2022-11-11T12:10:00.100Z");
  expect(getByTestId("hello")).toHaveTextContent("NEEDS_REFRESH");
  expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  expect(getByTestId("accessTokenExpiresOn")).toHaveTextContent("2022-11-11T12:10:00.100Z");

  await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));
  expect(getByTestId("accessToken")).toHaveTextContent("newAccessToken");
  // do not assert the seconds, as the timers would've advanced
  expect(getByTestId("accessTokenExpiresOn")).toHaveTextContent("2022-11-11T12:20");


  // // advance to the expiration time minus 10 second for timeBeforeExpirationRefresh
  // act(() => jest.advanceTimersByTime(599999 - 10000));
  // expect(new Date().toISOString()).toBe("2022-11-11T12:09:50.099Z");
  // expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED");
  // expect(getByTestId("accessToken")).toHaveTextContent("freshAccessToken");
  // expect(getByTestId("accessTokenExpiresOn")).toHaveTextContent("2022-11-11T12:10:00.100Z");

  // // Now trigger refresh
  // act(() => jest.advanceTimersByTime(1));
  // expect(new Date().toISOString()).toBe("2022-11-11T12:09:50.100Z");

  // await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("NEEDS_REFRESH"));
  // await waitFor(() => expect(getByTestId("hello")).toHaveTextContent("AUTHENTICATED"));
  // expect(getByTestId("accessToken")).toHaveTextContent("newAccessToken");
  // // do not assert the seconds, as the timers would've advanced
  // expect(getByTestId("accessTokenExpiresOn")).toHaveTextContent("2022-11-11T12:20");
});

afterEach(() => {
  fetchMock.mockReset();
  jest.useRealTimers();
  AppState.currentState = 'unknown'
})
