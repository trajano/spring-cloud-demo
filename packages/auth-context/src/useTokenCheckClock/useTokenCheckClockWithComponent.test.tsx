import { cleanup, fireEvent, render } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { AuthState } from '..';
import { useTokenCheckClock } from './useTokenCheckClock';
afterEach(cleanup);
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

function MyComponent() {
  const [authState, setAuthState] = useState(AuthState.INITIAL);
  const { lastCheckTime } = useTokenCheckClock(authState, null, 10);
  return <Pressable onPress={() => { setAuthState(AuthState.AUTHENTICATED) }} ><Text testID="lastCheckTime">{lastCheckTime}</Text></Pressable>
}
it("test with state update", () => {
  jest.setSystemTime(new Date("2025-01-01T20:00:00Z"));
  const {getByTestId} = render(<MyComponent />);
  expect(getByTestId("lastCheckTime")).toHaveTextContent("1735761600000")
  fireEvent.press(getByTestId("lastCheckTime"))
  expect(getByTestId("lastCheckTime")).toHaveTextContent("1735761600000")
})
afterEach(()=>{
  jest.useRealTimers();
})
