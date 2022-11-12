import type { NetInfoState } from '@react-native-community/netinfo';
/**
 * This gets fired when a valid authentication token was obtained after authentication or refresh.
 */
type AuthenticatedEvent = {
  type: 'Authenticated';
  /**
   * The raw access token.
   */
  accessToken: string;
  /**
   * A value suitable for Authorization HTTP header.
   */
  authorization: string;
  tokenExpiresAt: Date;
  /**
   * Reason for authentication if any
   */
  reason?: string;
};
/**
 * This gets fired when the refresh process is about to start and it is being checked if needed or possible.
 */
type CheckRefreshEvent = {
  type: 'CheckRefresh';
  /**
   * Reason for refresh if any
   */
  reason?: string;
};

/**
 * This gets fired when the refresh process is started
 */
type RefreshingEvent = {
  type: 'Refreshing';
  /**
   * Reason for refresh if any
   */
  reason?: string;
};
type ConnectionChangeEvent = {
  type: 'Connection';
  /**
   * Current net info state.
   */
  netInfoState: NetInfoState;
  /**
   * Reason for refresh if any
   */
  reason?: string;
};
/**
 * This gets fired when there is a transition from authenticated to unauthenticated.  Or when the initial
 * state had determined that the user is not authenticated/
 */
type UnauthenticatedEvent = {
  type: 'Unauthenticated';
  /**
   * Reason why it is not authenticated if any.
   */
  reason?: string;
  /**
   * Body of response if available
   */
  responseBody?: string;
};
export type AuthEvent =
  | AuthenticatedEvent
  | CheckRefreshEvent
  | ConnectionChangeEvent
  | RefreshingEvent
  | UnauthenticatedEvent;
