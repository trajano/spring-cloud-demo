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
        tokenRefreshable: true,
        notify,
        refreshAsync: refresh,
      },
    }
  );
  expect(setAuthState).toBeCalledTimes(2);
  expect(setAuthState).toHaveBeenNthCalledWith(1, AuthState.REFRESHING);
  expect(setAuthState).toHaveBeenNthCalledWith(2, AuthState.AUTHENTICATED);
  expect(refresh).toBeCalledTimes(1);
});

test('backend not accessible', () => {
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
        tokenRefreshable: false,
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

test('backend not accessible', () => {
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
        tokenRefreshable: false,
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
