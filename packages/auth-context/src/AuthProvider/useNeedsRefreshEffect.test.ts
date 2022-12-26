import { renderHook } from '@testing-library/react-hooks';
import type { Dispatch, SetStateAction } from 'react';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import {
  NeedsRefreshEffectProps,
  useNeedsRefreshEffect,
} from './useNeedsRefreshEffect';

test('happy path with one cycle and updating all the way to needs refresh', () => {
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const onRefreshError = jest.fn();
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const refresh = jest.fn(async () => {
    setAuthState(AuthState.AUTHENTICATED);
    return Promise.resolve();
  }) as jest.Mocked<() => Promise<void>>;

  renderHook<NeedsRefreshEffectProps, void>(
    (props) => useNeedsRefreshEffect(props),
    {
      initialProps: {
        authState: AuthState.NEEDS_REFRESH,
        setAuthState,
        backendReachable: true,
        notify,
        onRefreshError,
        refreshAsync: refresh,
      },
    }
  );
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.AUTHENTICATED);
  expect(refresh).toBeCalledTimes(1);
});

test('backend not accessible', () => {
  const onRefreshError = jest.fn();
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const refresh = jest.fn(async () => {
    setAuthState(AuthState.AUTHENTICATED);
    return Promise.resolve();
  }) as jest.Mocked<() => Promise<void>>;

  renderHook<NeedsRefreshEffectProps, void>(
    (props) => useNeedsRefreshEffect(props),
    {
      initialProps: {
        authState: AuthState.NEEDS_REFRESH,
        setAuthState,
        backendReachable: false,
        onRefreshError,
        refreshAsync: refresh,
        notify,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(1);
  expect(setAuthState).toHaveBeenNthCalledWith(
    1,
    AuthState.BACKEND_INACCESSIBLE
  );
  expect(refresh).toBeCalledTimes(0);
});

test('backend not accessible #2', () => {
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const onRefreshError = jest.fn();
  const refresh = jest.fn(async () => {
    setAuthState(AuthState.AUTHENTICATED);
    return Promise.resolve();
  }) as jest.Mocked<() => Promise<void>>;

  renderHook<NeedsRefreshEffectProps, void>(
    (props) => useNeedsRefreshEffect(props),
    {
      initialProps: {
        authState: AuthState.NEEDS_REFRESH,
        setAuthState,
        onRefreshError,
        backendReachable: false,
        refreshAsync: refresh,
        notify,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(1);
  expect(setAuthState).toHaveBeenNthCalledWith(
    1,
    AuthState.BACKEND_INACCESSIBLE
  );
  expect(refresh).toBeCalledTimes(0);
});
