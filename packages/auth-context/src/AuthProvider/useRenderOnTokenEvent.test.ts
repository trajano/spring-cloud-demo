import {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';
import { renderHook } from '@testing-library/react-native';

import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import {
  RenderOnTokenEventProps,
  RenderOnTokenEventState,
  useRenderOnTokenEvent,
} from './useRenderOnTokenEvent';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import { useNetInfoState } from '../useNetInfoState';

jest.mock('./useAppStateWithNetInfoRefresh');
jest.mock('../useNetInfoState');
it('should return the state correctly when mocked', () => {
  const endpointConfiguration = {} as EndpointConfiguration;
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
    RenderOnTokenEventState,
    RenderOnTokenEventProps
  >((props) => useRenderOnTokenEvent(props), {
    initialProps: {
      endpointConfiguration,
    },
  });
  expect(result.current.backendReachable).toBe(true);
  expect(result.current.netInfoState.isConnected).toBe(true);
  expect(result.current.netInfoState.isInternetReachable).toBe(true);
});

it('should handle state updates', () => {
  const endpointConfiguration = {} as EndpointConfiguration;
  const mockUseAppStateWithNetInfoRefresh = jest.mocked(
    useAppStateWithNetInfoRefresh
  );
  mockUseAppStateWithNetInfoRefresh.mockImplementation(() => 'active');
  const mockUseNetInfoState = jest.mocked(useNetInfoState);
  mockUseNetInfoState.mockImplementationOnce(
    () =>
      ({
        isConnected: false,
        isInternetReachable: false,
      } as NetInfoState)
  );
  const { result, rerender } = renderHook<
    RenderOnTokenEventState,
    RenderOnTokenEventProps
  >((props) => useRenderOnTokenEvent(props), {
    initialProps: {
      endpointConfiguration,
    },
  });
  expect(result.current.backendReachable).toBe(false);

  mockUseNetInfoState.mockImplementationOnce(
    () =>
      ({
        isConnected: true,
        isInternetReachable: false,
      } as NetInfoState)
  );
  rerender({ endpointConfiguration });
  expect(result.current.backendReachable).toBe(false);

  mockUseNetInfoState.mockImplementationOnce(
    () =>
      ({
        isConnected: true,
        isInternetReachable: true,
      } as NetInfoState)
  );
  rerender({ endpointConfiguration });
  expect(result.current.backendReachable).toBe(true);
});
