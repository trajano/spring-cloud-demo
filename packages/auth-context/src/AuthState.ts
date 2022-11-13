export enum AuthState {
  INITIAL,
  /**
   * Authenticated means that the token is valid.
   */
  AUTHENTICATED,
  UNAUTHENTICATED,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be verified successfully.
   */
  NEEDS_REFRESH,
  /**
   * In this state, the token was authenticated at one point but now needs to be refreshed.
   * The access token is still available, but it is not guaranteed to be verified successfully.
   * However, the backend is actually down so a retry is needed.
   */
  BACKEND_FAILURE,
}
