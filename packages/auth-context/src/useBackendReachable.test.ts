import { act, renderHook } from '@testing-library/react-native';
import fetchMock from 'fetch-mock';

import { buildSimpleEndpointConfiguration } from './buildSimpleEndpointConfiguration';
import { useBackendReachable } from './useBackendReachable';
it('should say it is reachable if the ping endpoint is up after effect', async () => {
  fetchMock.get('https://asdf.com/ping', { body: { ok: true } });

  const { result } = renderHook(() =>
    useBackendReachable(buildSimpleEndpointConfiguration('https://asdf.com/'))
  );
  expect(result.current).toBe(false);
  await act(() => Promise.resolve());
  expect(result.current).toBe(true);
});
afterEach(() => fetchMock.reset());
