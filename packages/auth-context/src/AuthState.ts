export enum AuthState {
  INITIAL,
  /**
   * Authenticated means that the token is valid.
   */
  AUTHENTICATED,
  /**
   * Unauthenticated means that there is no token information at all.
   */
  UNAUTHENTICATED,
  /**
   * In this state, the refresh is running at the moment.
   */
  REFRESHING,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be work successfully.
   */
  NEEDS_REFRESH,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be work successfully.
   * However, the backend is returning an error.  A retry is needed, but based on a time.
   */
  BACKEND_FAILURE,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be work successfully.
   * However, the backend is not accessible due to network issues.  A retry is needed but
   * based on the connection state being updated.
   */
  BACKEND_INACCESSIBLE,
}
