import { renderHook } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';

import {
  BackendFailureTimeoutProps,
  BackendFailureTimeoutState,
  useBackendFailureTimeoutEffect,
} from './useBackendFailureTimeoutEffect';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

test('active backend failure', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');

  jest.setSystemTime(specimenTime);

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  renderHook<BackendFailureTimeoutState, BackendFailureTimeoutProps>(
    (props) => useBackendFailureTimeoutEffect(props),
    {
      initialProps: {
        authState: AuthState.BACKEND_FAILURE,
        setAuthState,
        notify,
        backendFailureTimeout: 30000,
      },
    }
  );
  expect(setAuthState).toHaveBeenCalledTimes(0);
  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(29999);
  expect(setAuthState).toHaveBeenCalledTimes(0);
  jest.advanceTimersByTime(1);
  expect(setAuthState).toHaveBeenCalledTimes(1);
  expect(setAuthState).toHaveBeenCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toHaveBeenCalledTimes(1);
});

test('do nothing when not authenticated', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');

  jest.setSystemTime(specimenTime);

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  renderHook<BackendFailureTimeoutState, BackendFailureTimeoutProps>(
    (props) => useBackendFailureTimeoutEffect(props),
    {
      initialProps: {
        authState: AuthState.AUTHENTICATED,
        setAuthState,
        notify,
        backendFailureTimeout: 30000,
      },
    }
  );
  expect(setAuthState).toHaveBeenCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);
  jest.advanceTimersByTime(60000);
  jest.advanceTimersByTime(49999);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:49.999Z'));
  jest.advanceTimersByTime(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:50.000Z'));
  expect(setAuthState).toHaveBeenCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toHaveBeenCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:03:50.000Z'));
});

test('activate and then cancel backend failure timer', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');

  jest.setSystemTime(specimenTime);

  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const { rerender } = renderHook<
    BackendFailureTimeoutState,
    BackendFailureTimeoutProps
  >((props) => useBackendFailureTimeoutEffect(props), {
    initialProps: {
      authState: AuthState.AUTHENTICATED,
      setAuthState,
      notify,
      backendFailureTimeout: 30000,
    },
  });
  expect(setAuthState).toHaveBeenCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);

  // pretend to backend failure
  setAuthState(AuthState.BACKEND_FAILURE);
  rerender({
    authState: AuthState.BACKEND_FAILURE,
    setAuthState,
    notify,
    backendFailureTimeout: 30000,
  });

  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(10000);
  expect(jest.getTimerCount()).toBe(1);

  setAuthState(AuthState.AUTHENTICATED);
  rerender({
    authState: AuthState.AUTHENTICATED,
    setAuthState,
    notify,
    backendFailureTimeout: 30000,
  });
  expect(jest.getTimerCount()).toBe(0);
});
