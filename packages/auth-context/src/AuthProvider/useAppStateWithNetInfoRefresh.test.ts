import { act, renderHook } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';

import { useAppStateWithNetInfoRefresh } from './useAppStateWithNetInfoRefresh';
describe('useAppStateWithNetInfo', () => {
  beforeEach(jest.clearAllMocks);
  afterEach(jest.restoreAllMocks);
  const noop = () => {};
  it('should render hook', () => {
    const { result } = renderHook(() => useAppStateWithNetInfoRefresh());
    expect(result.current).toBeUndefined();
  });

  it('should handle refreshing state', async () => {
    let capturedHandler: (state: AppStateStatus) => void = noop;
    const mockUnsubscribeListener = jest.fn();
    const mockAddListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((nextEvent, nextCapturedHandler) => {
        expect(nextEvent).toBe('change');
        capturedHandler = nextCapturedHandler;
        return {
          remove: () => {
            mockUnsubscribeListener();
          },
        };
      });

    const { result, unmount } = renderHook(() =>
      useAppStateWithNetInfoRefresh()
    );
    expect(result.current).toBeUndefined();

    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(capturedHandler).not.toBe(noop);
    expect(mockUnsubscribeListener).not.toHaveBeenCalled();

    await act(() => capturedHandler('active'));
    expect(result.current).toBe('active');

    unmount();
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeListener).toHaveBeenCalledTimes(1);
  });
});
