import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import React, { useCallback, useEffect, useState } from 'react';
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
    const onPress = useCallback(() => {
      setAuthState('AuthState.AUTHENTICATED');
    }, [setAuthState]);
    return (
      <Pressable onPress={onPress}>
        <Text testID="lastCheckTime">{lastCheckTime}</Text>
      </Pressable>
    );
  }

  jest.setSystemTime(new Date('2025-01-01T20:00:00Z'));
  const { unmount } = render(<MyComponent />);
  expect(screen.getByTestId('lastCheckTime')).toHaveTextContent(
    '1735761600000'
  );
  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(effectCleanup).toHaveBeenCalledTimes(0);
  expect(rendered).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1000);
  fireEvent.press(screen.getByTestId('lastCheckTime'));
  // remains the same
  expect(screen.getByTestId('lastCheckTime')).toHaveTextContent(
    '1735761600000'
  );
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
    const onPress = useCallback(() => {
      setAuthState('AuthState.AUTHENTICATED');
    }, [setAuthState]);
    rendered({ authState, lastCheckTime });
    return (
      <Pressable onPress={onPress}>
        <Text testID="lastCheckTime">{lastCheckTime}</Text>
      </Pressable>
    );
  }

  jest.setSystemTime(new Date('2025-01-01T20:00:00Z'));
  const { unmount } = render(<MyComponent />);
  expect(screen.getByTestId('lastCheckTime')).toHaveTextContent(
    '1735761600000'
  );
  expect(effectCallback).toHaveBeenCalledTimes(1);
  expect(effectCleanup).toHaveBeenCalledTimes(0);
  expect(rendered).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(1000);
  fireEvent.press(screen.getByTestId('lastCheckTime'));
  expect(screen.getByTestId('lastCheckTime')).toHaveTextContent(
    '1735761601000'
  );
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
