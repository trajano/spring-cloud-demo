import { expect, jest } from '@jest/globals';
import {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';
import { renderHook } from '@testing-library/react-hooks';
import type { EndpointConfiguration } from '../EndpointConfiguration';
import { useNetInfoState } from '../useNetInfoState';
import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
import {
  RenderOnTokenEventProps,
  RenderOnTokenEventState,
  useRenderOnTokenEvent,
} from './useRenderOnTokenEvent';

jest.mock('./useAppStateWithNetInfoRefresh');
jest.mock('../useNetInfoState');
it('should return the state correctly when mocked', async () => {
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
    RenderOnTokenEventProps,
    RenderOnTokenEventState
  >((props) => useRenderOnTokenEvent(props), {
    initialProps: {
      endpointConfiguration,
    },
  });
  expect(result.current.backendReachable).toBe(true);
  expect(result.current.netInfoState.isConnected).toBe(true);
  expect(result.current.netInfoState.isInternetReachable).toBe(true);
});
