import { cleanup, render, waitFor } from '@testing-library/react-native';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { act } from 'react-test-renderer';
import { AuthState } from './AuthState';
import type { EndpointConfiguration } from './EndpointConfiguration';
import { useAuth } from './useAuth';
afterEach(cleanup);
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
})

it("default context values", async () => {
  function MyComponent() {
    const auth = useAuth();
    const [login, setLogin] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [logout, setLogout] = useState(false);
    const [subscribe, setSubscribe] = useState(false);
    useEffect(() => {
      (async () => {
        try { await auth.login({ a: "b" }) }
        catch (e) {
          setLogin(true)
        }
        try { await auth.refresh() }
        catch (e) {
          setRefresh(true)
        }

        await auth.logout();
        setLogout(true)

        await auth.forceCheckAuthStorage();

        auth.subscribe(jest.fn())();
        setSubscribe(true)
        auth.setEndpointConfiguration({} as EndpointConfiguration);
      })();
    }, [])
    return (<View>
      <Text testID='hello'>{AuthState[auth.authState]}</Text>
      <Text testID='login'>{login ? "login" : ""}</Text>
      <Text testID='refresh'>{refresh ? "refresh" : ""}</Text>
      <Text testID='logout'>{logout ? "logout" : ""}</Text>
      <Text testID='subscribe'>{subscribe ? "subscribe" : ""}</Text>
    </View>)
  }

  const { getByTestId } = render(<MyComponent />)
  act(() => jest.runAllTicks());
  expect(getByTestId("hello")).toHaveTextContent("INITIAL");
  await waitFor(() => { expect(getByTestId("login")).toHaveTextContent("login"); })
  await waitFor(() => { expect(getByTestId("refresh")).toHaveTextContent("refresh"); })
  await waitFor(() => { expect(getByTestId("logout")).toHaveTextContent("logout"); })
  await waitFor(() => { expect(getByTestId("subscribe")).toHaveTextContent("subscribe"); })

})
afterEach(() => {
  jest.useRealTimers();
})
