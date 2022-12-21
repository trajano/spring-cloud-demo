import { act, renderHook } from '@testing-library/react-hooks';
import type { Dispatch, SetStateAction } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import {
  NeedsRefreshEffectProps,
  useNeedsRefreshEffect,
} from './useNeedsRefreshEffect';
import {
  TokenExpirationTimeoutEffectProps,
  TokenExpirationTimeoutState,
  useTokenExpirationTimeoutEffect,
} from './useTokenExpirationTimeoutEffect';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
});

test('happy path from intial to authenticated to needs refresh then back to authenticated', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');

  jest.setSystemTime(specimenTime);

  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const refresh = jest.fn(async () => {
    setAuthState(AuthState.AUTHENTICATED);
    return Promise.resolve();
  }) as jest.Mocked<() => Promise<void>>;
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;

  const { rerender: rerenderTokenExpirationTimeout } = renderHook<
    TokenExpirationTimeoutEffectProps,
    TokenExpirationTimeoutState
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
    NeedsRefreshEffectProps,
    void
  >((props) => useNeedsRefreshEffect(props), {
    initialProps: {
      authState: AuthState.INITIAL,
      setAuthState,
      tokenRefreshable: true,
      refresh,
      notify,
    },
  });

  expect(setAuthState).toBeCalledTimes(0);
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
    tokenRefreshable: true,
    refresh,
    notify,
  });

  expect(jest.getTimerCount()).toBe(1);
  act(() => jest.advanceTimersByTime(60000));
  jest.advanceTimersByTime(49999);
  expect(setAuthState).toBeCalledTimes(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:49.999Z'));
  act(() => jest.advanceTimersByTime(1));
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:50.000Z'));
  expect(setAuthState).toBeCalledTimes(2);
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
    tokenRefreshable: true,
    refresh,
    notify,
  });
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toBeCalledTimes(4);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:03:50.000Z'));

  // update to new value
  tokenExpiresAt = new Date('2025-01-01T03:05:00Z');
  expect(setAuthState).toBeCalledTimes(4);
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
  expect(setAuthState).toBeCalledTimes(4);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:04:49.999Z'));
  act(() => jest.advanceTimersByTime(1));
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:04:50.000Z'));
  expect(setAuthState).toBeCalledTimes(5);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);
});
