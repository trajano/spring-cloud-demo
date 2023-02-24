import { act, renderHook } from '@testing-library/react-native';
import { addSeconds } from 'date-fns';

import { useUsableTokenStateEffect } from './useUsableTokenStateEffect';
import type { AuthEvent, UsableTokenEvent } from '../../AuthEvent';
import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';
it("should just go to authenticated because we're not waiting", async () => {
  const notify = jest.fn();
  const setAuthState = jest.fn<void, [AuthState]>();
  const signalTokenProcessed = jest.fn<void, []>();
  renderHook<
    void,
    Pick<
      InternalProviderState,
      | 'authState'
      | 'oauthToken'
      | 'notify'
      | 'setAuthState'
      | 'tokenExpiresAt'
      | 'signalTokenProcessed'
      | 'tokenProcessed'
      | 'waitForSignalWhenNewTokenIsProcessed'
    >
  >((props) => useUsableTokenStateEffect(props), {
    initialProps: {
      authState: AuthState.USABLE_TOKEN,
      oauthToken: {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        token_type: 'Bearer',
        expires_in: 60,
      },
      signalTokenProcessed,
      tokenProcessed: true,
      tokenExpiresAt: addSeconds(Date.now(), 60),
      waitForSignalWhenNewTokenIsProcessed: false,
      notify,
      setAuthState,
    },
  });
  await act(() => Promise.resolve());
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.AUTHENTICATED);
});

it('should work with a signal', async () => {
  const notify = jest.fn<void, [AuthEvent]>();
  const setAuthState = jest.fn<void, [AuthState]>();
  const signalTokenProcessed = jest.fn<void, []>();
  const { rerender } = renderHook<
    void,
    Pick<
      InternalProviderState,
      | 'authState'
      | 'oauthToken'
      | 'notify'
      | 'setAuthState'
      | 'tokenExpiresAt'
      | 'signalTokenProcessed'
      | 'tokenProcessed'
      | 'waitForSignalWhenNewTokenIsProcessed'
    >
  >((props) => useUsableTokenStateEffect(props), {
    initialProps: {
      authState: AuthState.USABLE_TOKEN,
      oauthToken: {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        token_type: 'Bearer',
        expires_in: 60,
      },
      signalTokenProcessed,
      tokenProcessed: false,
      tokenExpiresAt: addSeconds(Date.now(), 60),
      waitForSignalWhenNewTokenIsProcessed: true,
      notify,
      setAuthState,
    },
  });
  await act(() => Promise.resolve());
  expect(setAuthState).not.toHaveBeenCalled();
  expect(notify).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'UsableToken',
      authState: AuthState.USABLE_TOKEN,
    })
  );

  expect(notify).toHaveBeenCalledTimes(1);
  const notifyCall = notify.mock.calls[0]![0] as UsableTokenEvent;
  const signalTokenProcessedFromEvent = notifyCall.signalTokenProcessed;
  expect(signalTokenProcessedFromEvent).toBe(signalTokenProcessed);

  // Pretend to call it
  signalTokenProcessedFromEvent();

  rerender({
    authState: AuthState.USABLE_TOKEN,
    oauthToken: {
      access_token: 'access_token',
      refresh_token: 'refresh_token',
      token_type: 'Bearer',
      expires_in: 60,
    },
    signalTokenProcessed,
    tokenProcessed: true,
    tokenExpiresAt: addSeconds(Date.now(), 60),
    waitForSignalWhenNewTokenIsProcessed: true,
    notify,
    setAuthState,
  });

  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.AUTHENTICATED);
});
