import { expect, jest } from '@jest/globals';
import {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';
import { renderHook } from '@testing-library/react-hooks';
import { addMilliseconds } from 'date-fns';
import type { Dispatch, SetStateAction } from 'react';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';
import type { OAuthToken } from '../OAuthToken';
import { useNetInfoState } from '../useNetInfoState';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import {
  RenderOnTokenEventProps,
  RenderOnTokenEventState,
  useRenderOnTokenEvent,
} from './useRenderOnTokenEvent';

jest.mock('./useAppStateWithNetInfoRefresh');
jest.mock('../useNetInfoState');
it.skip('should not get stuck on refreshing state when authenticated', () => {
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const endpointConfiguration = {} as EndpointConfiguration;
  const oauthToken = {} as OAuthToken;
  const tokenExpiresAt = addMilliseconds(new Date(), 100000);
  jest.mocked(useAppStateWithNetInfoRefresh).mockImplementation(() => 'active');
  jest.mocked(useNetInfoState).mockImplementation(
    () =>
      ({
        isConnected: true,
        isInternetReachable: true,
        type: NetInfoStateType.wifi,
        details: {},
      } as NetInfoState)
  );
  const { result } = renderHook<
    RenderOnTokenEventProps,
    RenderOnTokenEventState
  >((props) => useRenderOnTokenEvent(props), {
    initialProps: {
      authState: AuthState.REFRESHING,
      setAuthState,
      notify,
      endpointConfiguration,
      timeBeforeExpirationRefresh: 10000,
      oauthToken,
      tokenExpiresAt,
    },
  });
  expect(result.current.backendReachable).toBe(true);
  expect(setAuthState).toBeCalledWith(AuthState.AUTHENTICATED);
});

it.skip('should not get stuck on refreshing state when expired', () => {
  const notify = jest.fn() as jest.Mocked<(event: AuthEvent) => void>;
  const setAuthState = jest.fn() as jest.Mocked<
    Dispatch<SetStateAction<AuthState>>
  >;
  const endpointConfiguration = {} as EndpointConfiguration;
  const oauthToken = {} as OAuthToken;
  const tokenExpiresAt = new Date(0);
  jest.mocked(useAppStateWithNetInfoRefresh).mockImplementation(() => 'active');
  jest.mocked(useNetInfoState).mockImplementation(
    () =>
      ({
        isConnected: true,
        isInternetReachable: true,
        type: NetInfoStateType.wifi,
        details: {},
      } as NetInfoState)
  );
  const { result } = renderHook<
    RenderOnTokenEventProps,
    RenderOnTokenEventState
  >((props) => useRenderOnTokenEvent(props), {
    initialProps: {
      authState: AuthState.REFRESHING,
      setAuthState,
      notify,
      endpointConfiguration,
      timeBeforeExpirationRefresh: 10000,
      oauthToken,
      tokenExpiresAt,
    },
  });
  expect(result.current.backendReachable).toBe(true);
  expect(setAuthState).toBeCalledWith(AuthState.NEEDS_REFRESH);
});
