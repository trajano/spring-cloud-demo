import { act, cleanup, renderHook } from '@testing-library/react-hooks';

import { useNetInfoState } from './useNetInfoState';
afterEach(cleanup);
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

it('should switch to connected', async () => {
  const { result, waitFor } = renderHook(() =>
    useNetInfoState({ pingEndpoint: 'https://api.trajano.net/ping' })
  );
  // initial value
  expect(result.current).toStrictEqual({
    type: 'unknown',
    isConnected: null,
    isInternetReachable: null,
    details: null,
  });
  act(() => jest.runAllTicks());
  await waitFor(() => expect(result.current.isConnected).toBeTruthy());
});
afterEach(() => {
  jest.useRealTimers();
});
