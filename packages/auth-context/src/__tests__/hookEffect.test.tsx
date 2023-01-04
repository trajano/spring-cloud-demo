import { cleanup, fireEvent, render } from '@testing-library/react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
afterEach(cleanup);
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

it('does not work with empty dep list', () => {
  const effectCallback = jest.fn();
  const effectCleanup = jest.fn();
  const rendered = jest.fn();
  function useMyHook(_state: string, _nonState: number): number {
    const [myState, setMyState] = useState(Date.now());
    useEffect(() => {
      effectCallback();
      setMyState(Date.now());
      return () => effectCleanup();
    }, []);
    return myState;
  }
  function MyComponent() {
    const [authState, setAuthState] = useState('AuthState.INITIAL');
    const lastCheckTime = useMyHook(authState, 10);
    rendered({ authState, lastCheckTime });
    return (
      <Pressable
        onPress={() => {
          setAuthState('AuthState.AUTHENTICATED');
        }}
      >
        <Text testID="lastCheckTime">{lastCheckTime}</Text>
      </Pressable>
    );
  }

  jest.setSystemTime(new Date('2025-01-01T20:00:00Z'));
  const { getByTestId, unmount } = render(<MyComponent />);
  expect(getByTestId('lastCheckTime')).toHaveTextContent('1735761600000');
  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(effectCleanup).toHaveBeenCalledTimes(0);
  expect(rendered).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1000);
  fireEvent.press(getByTestId('lastCheckTime'));
  // remains the same
  expect(getByTestId('lastCheckTime')).toHaveTextContent('1735761600000');
  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(effectCleanup).toHaveBeenCalledTimes(0);
  // rendered still because of auth state change
  expect(rendered).toHaveBeenCalledTimes(2);
  unmount();
  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(effectCleanup).toHaveBeenCalledTimes(1);
  expect(rendered).toHaveBeenCalledTimes(2);
});

it('works with dep list', () => {
  const effectCallback = jest.fn();
  const effectCleanup = jest.fn();
  const rendered = jest.fn();
  function useMyHook(state: string, nonState: number): number {
    const [myState, setMyState] = useState(Date.now());
    useEffect(() => {
      effectCallback();
      setMyState(Date.now());
      return () => effectCleanup();
    }, [state, nonState]);
    return myState;
  }
  function MyComponent() {
    const [authState, setAuthState] = useState('AuthState.INITIAL');
    const lastCheckTime = useMyHook(authState, 10);
    rendered({ authState, lastCheckTime });
    return (
      <Pressable
        onPress={() => {
          setAuthState('AuthState.AUTHENTICATED');
        }}
      >
        <Text testID="lastCheckTime">{lastCheckTime}</Text>
      </Pressable>
    );
  }

  jest.setSystemTime(new Date('2025-01-01T20:00:00Z'));
  const { getByTestId, unmount } = render(<MyComponent />);
  expect(getByTestId('lastCheckTime')).toHaveTextContent('1735761600000');
  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(effectCleanup).toHaveBeenCalledTimes(0);
  expect(rendered).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1000);
  fireEvent.press(getByTestId('lastCheckTime'));
  expect(getByTestId('lastCheckTime')).toHaveTextContent('1735761601000');
  expect(effectCallback).toHaveBeenCalledTimes(2);
  expect(effectCleanup).toHaveBeenCalledTimes(1);
  // authenticated which then calls set state to trigger two renders
  expect(rendered).toHaveBeenCalledTimes(3);
  unmount();
  expect(effectCallback).toHaveBeenCalledTimes(2);
  expect(effectCleanup).toHaveBeenCalledTimes(2);
  expect(rendered).toHaveBeenCalledTimes(3);
});
afterEach(() => {
  jest.useRealTimers();
});
