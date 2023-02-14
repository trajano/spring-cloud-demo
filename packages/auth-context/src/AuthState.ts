export enum AuthState {
  /**
   * Initial state. In this state all the auth data is pulled from storage. This
   * is the only time with the exception of
   * {@link IAuth.forceCheckAuthStorageAsync} where the OAuth token data is read
   * from {@link AuthStore}.
   */
  INITIAL,
  /**
   * Authenticated means that the token is valid **and** the backend is
   * reachable. This means any call is allowed.
   *
   * @category Token available
   */
  AUTHENTICATED,
  /**
   * Unauthenticated means that there is no token information at all. The
   * backend is expected to be available at this point so sign-in can be
   * performed.
   *
   * @category Token not available
   */
  UNAUTHENTICATED,
  /**
   * In this state, the refresh is running at the moment.
   *
   * @category Token available
   */
  REFRESHING,
  /**
   * In this state, the token was authenticated at one point but now needs to be
   * refreshed. The access token is still available, but it is not guaranteed to
   * be work successfully.
   *
   * @category Token available
   */
  NEEDS_REFRESH,
  /**
   * In this state, the token was authenticated at one point but now needs to be
   * refreshed. The access token is still available, but it is not guaranteed to
   * be work successfully. However, the backend is returning an error. A retry
   * is needed, but based on a time.
   *
   * @category Token available
   */
  BACKEND_FAILURE,
  /**
   * In this state, the token was authenticated at one point but now needs to be
   * refreshed. The access token is still available, but it is not guaranteed to
   * be work successfully. However, the backend is not accessible due to network
   * issues. A retry is needed but based on the connection state being updated.
   *
   * @category Token available
   */
  BACKEND_INACCESSIBLE,
  /**
   * There is no token available and the backend is not reachable.
   *
   * @category Token not available
   */
  UNAUTHENTICATED_OFFLINE,
  /**
   * The application was sent to the background while it had the token.
   *
   * @category Token available
   */
  BACKGROUNDED,
  /**
   * The application was brought back to the foreground when it had a token. The
   * token does not need to be valid or
   *
   * @category Token available
   */
  RESTORING,
  /**
   * The application has determined that it needs to remove the token.
   *
   * @category Token available
   */
  TOKEN_REMOVAL,
}
