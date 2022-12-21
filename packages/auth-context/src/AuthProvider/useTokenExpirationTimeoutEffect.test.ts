import { renderHook } from '@testing-library/react-hooks';
import type { Dispatch, SetStateAction } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
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

test('happy path with one cycle and updating all the way to needs refresh', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');
  const tokenExpiresAt = new Date('2025-01-01T03:03:00Z');

  jest.setSystemTime(specimenTime);

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  renderHook<TokenExpirationTimeoutEffectProps, TokenExpirationTimeoutState>(
    (props) => useTokenExpirationTimeoutEffect(props),
    {
      initialProps: {
        authState: AuthState.AUTHENTICATED,
        setAuthState,
        maxTimeoutForRefreshCheck: 60000,
        timeBeforeExpirationRefresh: 10000,
        tokenExpiresAt,
        notify,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(0);
  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(60000);
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toBeCalledTimes(0);
  jest.advanceTimersByTime(49999);
  expect(setAuthState).toBeCalledTimes(0);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:49.999Z'));
  jest.advanceTimersByTime(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:50.000Z'));
  expect(setAuthState).toBeCalledTimes(1);
  expect(setAuthState).toBeCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toBeCalledTimes(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:03:50.000Z'));
});

test('do nothing when not authenticated', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');
  const tokenExpiresAt = new Date('2025-01-01T03:03:00Z');

  jest.setSystemTime(specimenTime);

  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  renderHook<TokenExpirationTimeoutEffectProps, TokenExpirationTimeoutState>(
    (props) => useTokenExpirationTimeoutEffect(props),
    {
      initialProps: {
        authState: AuthState.NEEDS_REFRESH,
        setAuthState,
        maxTimeoutForRefreshCheck: 60000,
        timeBeforeExpirationRefresh: 10000,
        tokenExpiresAt,
        notify,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);
  jest.advanceTimersByTime(60000);
  jest.advanceTimersByTime(49999);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:49.999Z'));
  jest.advanceTimersByTime(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:50.000Z'));
  expect(setAuthState).toBeCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toBeCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:03:50.000Z'));
});

test('happy path from intial to authenticated to needs refresh then back to authenticated', () => {
  const specimenTime = new Date('2025-01-01T03:00:00Z');

  jest.setSystemTime(specimenTime);

  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const { rerender } = renderHook<
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
  expect(setAuthState).toBeCalledTimes(0);
  expect(jest.getTimerCount()).toBe(0);
  jest.advanceTimersByTime(60000);

  let tokenExpiresAt = new Date('2025-01-01T03:03:00Z');
  // pretend to authenticate
  setAuthState(AuthState.AUTHENTICATED);
  rerender({
    authState: AuthState.AUTHENTICATED,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh: 10000,
    tokenExpiresAt,
    notify,
  });

  expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(60000);
  jest.advanceTimersByTime(49999);
  expect(setAuthState).toBeCalledTimes(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:49.999Z'));
  jest.advanceTimersByTime(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:02:50.000Z'));
  expect(setAuthState).toBeCalledTimes(2);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);

  rerender({
    authState: AuthState.NEEDS_REFRESH,
    setAuthState,
    maxTimeoutForRefreshCheck: 60000,
    timeBeforeExpirationRefresh: 10000,
    tokenExpiresAt,
    notify,
  });

  // pretend to refresh
  setAuthState(AuthState.REFRESHING);
  jest.advanceTimersByTime(60000);
  expect(setAuthState).toBeCalledTimes(3);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:03:50.000Z'));

  // pretend that refresh was successful
  setAuthState(AuthState.AUTHENTICATED);
  // update to new value
  tokenExpiresAt = new Date('2025-01-01T03:05:00Z');
  expect(setAuthState).toBeCalledTimes(4);
  rerender({
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
  jest.advanceTimersByTime(1);
  expect(new Date()).toStrictEqual(new Date('2025-01-01T03:04:50.000Z'));
  expect(setAuthState).toBeCalledTimes(5);
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.NEEDS_REFRESH);
  expect(jest.getTimerCount()).toBe(0);
});
