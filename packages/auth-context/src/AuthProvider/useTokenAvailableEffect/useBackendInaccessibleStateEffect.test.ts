import { act, renderHook } from '@testing-library/react-native';

import { useBackendInaccessibleStateEffect } from './useBackendInaccessibleStateEffect';
import { AuthState } from '../../AuthState';
import type { InternalProviderState } from '../InternalProviderState';
test('backend inaccessible to accessible', async () => {
  const notify = jest.fn();
  const setAuthState = jest.fn<void, [AuthState]>();
  const { rerender } = renderHook<
    void,
    Pick<
      InternalProviderState,
      'authState' | 'backendReachable' | 'notify' | 'setAuthState'
    >
  >((props) => useBackendInaccessibleStateEffect(props), {
    initialProps: {
      authState: AuthState.BACKEND_INACCESSIBLE,
      backendReachable: false,
      notify,
      setAuthState,
    },
  });
  expect(setAuthState).not.toHaveBeenCalled();
  rerender({
    authState: AuthState.BACKEND_INACCESSIBLE,
    backendReachable: true,
    notify,
    setAuthState,
  });
  await act(() => Promise.resolve());
  expect(setAuthState).toHaveBeenLastCalledWith(AuthState.DISPATCHING);
  expect(notify).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'PingSucceeded',
      authState: AuthState.BACKEND_INACCESSIBLE,
    })
  );
});
