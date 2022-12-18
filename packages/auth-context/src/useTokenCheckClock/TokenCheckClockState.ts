export type TokenCheckClockState = {
  /**
   * Time since epoch when the check was last performed.  This is
   * backed by a React state so when it gets updated it is due
   * to a render.
   *
   * This state is backed by a reducer so that it rounds up to the nearest
   * second to reduce the frequency of state changes.
   */
  lastCheckTime: number;
};
