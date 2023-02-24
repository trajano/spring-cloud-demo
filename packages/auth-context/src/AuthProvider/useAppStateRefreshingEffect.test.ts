import { act, renderHook } from '@testing-library/react-native';
import { addHours } from 'date-fns';
import { AppState, AppStateStatus } from 'react-native';

import { useAppStateRefreshingEffect } from './useAppStateRefreshingEffect';
import { AuthState } from '../AuthState';
import type { OAuthToken } from '../OAuthToken';
describe('useAppStateRefreshingEffect', () => {
  beforeEach(jest.clearAllMocks);
  afterEach(jest.restoreAllMocks);
  const noop = () => {};
  it('should render hook', async () => {
    const setAuthState = jest.fn();
    const notify = jest.fn();
    renderHook((props) => useAppStateRefreshingEffect(props), {
      initialProps: {
        authState: AuthState.AUTHENTICATED,
        setAuthState,
        notify,
        backendReachable: true,
        oauthToken: {
          access_token: 'abc',
          refresh_token: 'def',
          expires_in: 321,
          token_type: 'Bearer',
        } as OAuthToken,
        tokenExpiresAt: addHours(Date.now(), 1),
        timeBeforeExpirationRefresh: 10000,
      },
    });
    expect(notify).not.toHaveBeenCalled();
    expect(setAuthState).not.toHaveBeenCalled();
    await act(() => Promise.resolve());
    expect(notify).not.toHaveBeenCalled();
    expect(setAuthState).not.toHaveBeenCalled();
  });

  it('should handle refreshing state', () => {
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

    const setAuthState = jest.fn();
    const notify = jest.fn();
    const { unmount } = renderHook(
      (props) => useAppStateRefreshingEffect(props),
      {
        initialProps: {
          authState: AuthState.REFRESHING,
          setAuthState,
          notify,
          backendReachable: true,
          oauthToken: {
            access_token: 'abc',
            refresh_token: 'def',
            expires_in: 321,
            token_type: 'Bearer',
          } as OAuthToken,
          tokenExpiresAt: addHours(Date.now(), 1),
          timeBeforeExpirationRefresh: 10000,
        },
      }
    );
    expect(notify).not.toHaveBeenCalled();
    expect(setAuthState).not.toHaveBeenCalled();
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(capturedHandler).not.toBe(noop);
    expect(mockUnsubscribeListener).not.toHaveBeenCalled();

    capturedHandler('active');
    expect(setAuthState).toHaveBeenCalledWith(AuthState.AUTHENTICATED);

    unmount();
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeListener).toHaveBeenCalledTimes(1);
  });

  it('should handle refreshing state expired', () => {
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

    const setAuthState = jest.fn();
    const notify = jest.fn();
    const { unmount } = renderHook(
      (props) => useAppStateRefreshingEffect(props),
      {
        initialProps: {
          authState: AuthState.REFRESHING,
          setAuthState,
          notify,
          backendReachable: true,
          oauthToken: {
            access_token: 'abc',
            refresh_token: 'def',
            expires_in: 321,
            token_type: 'Bearer',
          } as OAuthToken,
          tokenExpiresAt: new Date(0),
          timeBeforeExpirationRefresh: 10000,
        },
      }
    );
    expect(notify).not.toHaveBeenCalled();
    expect(setAuthState).not.toHaveBeenCalled();
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(capturedHandler).not.toBe(noop);
    expect(mockUnsubscribeListener).not.toHaveBeenCalled();

    capturedHandler('active');
    expect(setAuthState).toHaveBeenCalledWith(AuthState.DISPATCHING);

    unmount();
    expect(mockAddListener).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeListener).toHaveBeenCalledTimes(1);
  });
});
