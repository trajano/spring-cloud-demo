export enum AuthState {
    INITIAL,
    AUTHENTICATED,
    UNAUTHENTICATED,
    /**
     * In this state, the token needs to be refreshed.
     */
    NEEDS_REFRESH,
}
