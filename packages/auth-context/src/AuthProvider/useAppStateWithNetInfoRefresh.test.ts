import { act, renderHook } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';

import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
describe('useAppStateWithNetInfo', () => {
  beforeEach(jest.clearAllMocks);
  afterEach(jest.restoreAllMocks);
  const noop = () => {};
  it('should render hook', async () => {
    const { result } = renderHook(async () => useAppStateWithNetInfoRefresh());
    expect(await result.current).toBeUndefined();
  });

  it('should handle refreshing state', async () => {
    let capturedHandler: (state: AppStateStatus) => void = noop;
    const mockUnsubscribeListener = jest.fn();
    const mockAddListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((nextEvent, nextCapturedHandler) => {
        expect(nextEvent).toBe('change');
        capturedHandler = nextCapturedHandler;
        return { remove: () => mockUnsubscribeListener() };
      });

    const { result, unmount } = renderHook(async () =>
      useAppStateWithNetInfoRefresh()
    );
    expect(await result.current).toBeUndefined();

    expect(mockAddListener).toBeCalledTimes(1);
    expect(capturedHandler).not.toBe(noop);
    expect(mockUnsubscribeListener).not.toBeCalled();

    act(() => capturedHandler('active'));
    expect(await result.current).toBe('active');

    unmount();
    expect(mockAddListener).toBeCalledTimes(1);
    expect(mockUnsubscribeListener).toBeCalledTimes(1);
  });
});
