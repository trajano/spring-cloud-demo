import type { PropsWithChildren } from 'react';

import type { IAuthStore } from '../AuthStore';
import type { EndpointConfiguration } from '../EndpointConfiguration';

export type AuthProviderProps = PropsWithChildren<{
  /** Default endpoint configuration */
  defaultEndpointConfiguration: EndpointConfiguration;
  /**
   * AsyncStorage prefix used to store the authentication data. Applicable only
   * to the default auth store.
   */
  storagePrefix?: string;
  /**
   * Time in milliseconds to consider refreshing the access token. Defaults to
   * 10 seconds.
   */
  timeBeforeExpirationRefresh?: number;
  /** Alternative auth storage. */
  authStorage?: IAuthStore;
  onRefreshError?: (reason: unknown) => void;
  /**
   * If true (false default), it will wait for {@link IAuth.signalStart} to be
   * called before starts going to {@link AuthState.INITIAL} state.
   *
   * This is used to allow children to register authentication handlers before
   * entering {@link AuthState.INITIAL} state.
   */
  waitForSignalToStart?: boolean;
  /**
   * If true (false default), it will wait for
   * {@link UsableTokenEvent.signalTokenProcessed} or
   * {@link IAuth.signalTokenProcessed} to be called before it acknowledges that
   * the token is present before starts going from
   * {@link AuthState.UsableTokenEvent} to {@link AuthState.AUTHENTICATED} state.
   *
   * This is used to allow children to handle the scenario where an Axios
   * instance configured prior to being considered authenticated. If the client
   * is generated using data from the context at the moment of request creation
   * then this should be `false`.
   */
  waitForSignalWhenNewTokenIsProcessed?: boolean;
  /**
   * If true (false default), it will wait for
   * {@link WaitForDataLoadedEvent.signalDataLoaded} or
   * {@link IAuth.signalAppDataLoaded} to be called before it acknowledges that
   * the token is present before starts going from {@link AuthState.RESTORING} to
   * {@link AuthState.NEEDS_REFRESH} state.
   *
   * This is used to allow children to perform data load prior to being
   * considered authenticated.
   */
  waitForSignalWhenDataIsLoaded?: boolean;
}>;
