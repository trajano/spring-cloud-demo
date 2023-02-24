import type { NetInfoState } from '@react-native-community/netinfo';

import type { AuthState } from './AuthState';
interface CommonAuthEvent {
  type: string;
  authState: AuthState;
  /** Reason for event if any */
  reason?: string;
}
/**
 * This gets fired when a valid authentication token was obtained after
 * authentication or refresh. Exported so it can be used in a test.
 */
export type AuthenticatedEvent = CommonAuthEvent & {
  type: 'Authenticated';
  /** The raw access token. */
  accessToken: string;
  /** A value suitable for Authorization HTTP header. */
  authorization: string;
  tokenExpiresAt: Date;
};
/**
 * This gets fired when a valid authentication token was obtained after
 * authentication. This is not fired when there is a refresh and is fired before
 * {@link AuthenticatedEvent}
 */
type LoggedInEvent = CommonAuthEvent & {
  type: 'LoggedIn';
  /** The raw access token. */
  accessToken: string;
  /** A value suitable for Authorization HTTP header. */
  authorization: string;
  tokenExpiresAt: Date;
};
/**
 * This gets fired when the refresh process is about to start and it is being
 * checked if needed or possible.
 */
type CheckRefreshEvent = CommonAuthEvent & {
  type: 'CheckRefresh';
  lastCheckTime?: Date;
  tokenExpired?: boolean;
  tokenExpiresAt?: Date | null;
  backendReachable?: boolean;
};

/**
 * This gets fired when the refresh process is started. This occurs before the
 * app client refresh is called.
 */
type RefreshingEvent = CommonAuthEvent & {
  type: 'Refreshing';
};

/** This gets fired when {@link IAuth.signalStart} is called. */
type StartingEvent = CommonAuthEvent & {
  type: 'Starting';
};

/**
 * Connection change event. This is explicity exported to allow better type
 * safety.
 */
export type ConnectionChangeEvent = CommonAuthEvent & {
  type: 'Connection';
  /** Current net info state. */
  netInfoState: NetInfoState;
};
type TokenExpirationEvent = CommonAuthEvent & {
  type: 'TokenExpiration';
  /** Body of response if available */
  responseBody?: string;
  /** Net info state. */
  netInfoState?: NetInfoState;
  error?: Error;
};
type TokenLoadedEvent = CommonAuthEvent & {
  type: 'TokenLoaded';
};
/**
 * This event is fired when the token is deemed to be valid and usable. Not
 * necessarily that is is not expired and the backend is available
 */
export type UsableTokenEvent = CommonAuthEvent & {
  type: 'UsableToken';
  /** The raw access token. */
  accessToken: string;
  /** A value suitable for Authorization HTTP header. */
  authorization: string;
  tokenExpiresAt: Date;
  signalTokenProcessed: () => void;
};
type PingFailedEvent = CommonAuthEvent & {
  type: 'PingFailed';
  backendReachable: boolean;
};
type PingSucceededEvent = CommonAuthEvent & {
  type: 'PingSucceeded';
  backendReachable: boolean;
};
/**
 * Fired soon after entering {@link AuthState.RESTORE} and provides a signal
 * callback allowing the provider to know when the data has been loaded.
 */
export type WaitForDataLoadedEvent = CommonAuthEvent & {
  type: 'WaitForDataLoaded';
  /** This should be false in this state. */
  appDataLoaded: boolean;
  /**
   * This method should be called by a listener to indicate that the data is
   * loaded
   *
   * @returns
   */
  signalDataLoaded: () => void;
};
type DataLoadedEvent = CommonAuthEvent & {
  type: 'DataLoaded';
};
/**
 * This gets fired when there is a transition from authenticated to
 * unauthenticated. Or when the initial state had determined that the user is
 * not authenticated/
 */
type UnauthenticatedEvent = CommonAuthEvent & {
  type: 'Unauthenticated';
  /** Body of response if available */
  responseBody?: string;
};
/**
 * This gets fired when there was an explicit logoff event. This is fired before
 * {@link UnauthenticatedEvent}. A use case for handling this event is to remove
 * any notification or background fetch handlers from the app and also to
 * deregister the notification token on a remote server.
 */
type LoggedOutEvent = CommonAuthEvent & {
  type: 'LoggedOut';
};
export type AuthEvent =
  | AuthenticatedEvent
  | CheckRefreshEvent
  | ConnectionChangeEvent
  | DataLoadedEvent
  | LoggedInEvent
  | LoggedOutEvent
  | PingFailedEvent
  | PingSucceededEvent
  | RefreshingEvent
  | StartingEvent
  | TokenLoadedEvent
  | TokenExpirationEvent
  | UnauthenticatedEvent
  | UsableTokenEvent
  | WaitForDataLoadedEvent;
