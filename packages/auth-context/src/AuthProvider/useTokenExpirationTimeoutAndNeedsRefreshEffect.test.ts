import { act, renderHook } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';

import {
  NeedsRefreshEffectProps,
  useNeedsRefreshEffect,
} from './useNeedsRefreshEffect';
import {
  TokenExpirationTimeoutEffectProps,
  TokenExpirationTimeoutState,
  useTokenExpirationTimeoutEffect,
} from './useTokenExpirationTimeoutEffect';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: false });
});

afterEach(() => {
  jest.useRealTimers();
});

test('happy path from intial to authenticated to needs refresh then back to authenticated', async () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');

  jest.setSystemTime(specimenTime);

  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const onRefreshError = jest.fn();
  const refreshAsync = jest.fn(async () => {
    setAuthState(AuthState.AUTHENTICATED);
    return Promise.resolve();
  }) as jest.Mocked<() => Promise<void>>;
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;

  const { rerender: rerenderTokenExpirationTimeout } = renderHook<
    TokenExpirationTimeoutState,
    TokenExpirationTimeoutEffectProps
  >((props) => useTokenExpirationTimeoutEffect(props), {
    initialProps: {
      authState: AuthState.INITIAL,
      setAuthState,
      maxTimeoutForRefreshCheck: 60000,
      timeBeforeExpirationRefresh: 10000,
      notify,
    } as TokenExpirationTimeoutEffectProps,
  });

  const { rerender: rerenderNeedsRefresh } = renderHook<
    void,
    NeedsRefreshEffectProps
  >((props) => useNeedsRefreshEffect(props), {
    initialProps: {
      authState: AuthState.INITIAL,
      setAuthState,
      backendReachable: true,
      onRefreshError,
      refreshAsync,
      notify,
    },
  });

  expect(setAuthState).toHaveBeenCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);

  let tokenExpiresAt = new Date('2025-01-01T03:03:00Z');
  // pretend to authenticate
  setAuthState(AuthState.AUTHENTICATED);
  rerenderTokenExpirationTimeout({
    authState: AuthState.AUTHENTICATED,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh: 10000,
    tokenExpiresAt,
    notify,
  });
  rerenderNeedsRefresh({
    authState: AuthState.AUTHENTICATED,
    setAuthState,
    onRefreshError,
    backendReachable: true,
    refreshAsync,
    notify,
  });

  expect(jest.getTimerCount()).toBe(1);
  await act(() => jest.advanceTimersByTime(60000));
  jest.advanceTimersByTime(49999);
  expect(setAuthState).toHaveBeenCalledTimes(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:49.999Z'));
  await act(() => jest.advanceTimersByTime(1));
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:50.000Z'));
  expect(setAuthState).toHaveBeenCalledTimes(2);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);

  rerenderTokenExpirationTimeout({
    authState: AuthState.NEEDS_REFRESH,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh: 10000,
    tokenExpiresAt,
    notify,
  });
  rerenderNeedsRefresh({
    authState: AuthState.NEEDS_REFRESH,
    setAuthState,
    onRefreshError,
    backendReachable: true,
    refreshAsync,
    notify,
  });
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toHaveBeenCalledTimes(3);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:03:50.000Z'));

  // update to new value
  tokenExpiresAt = new Date('2025-01-01T03:05:00Z');
  expect(setAuthState).toHaveBeenCalledTimes(3);
  rerenderTokenExpirationTimeout({
    authState: AuthState.AUTHENTICATED,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh: 10000,
    tokenExpiresAt,
    notify,
  });

  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(10000);
  jest.advanceTimersByTime(49999);
  expect(setAuthState).toHaveBeenCalledTimes(3);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:04:49.999Z'));
  await act(() => jest.advanceTimersByTime(1));
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:04:50.000Z'));
  expect(setAuthState).toHaveBeenCalledTimes(4);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);
});
