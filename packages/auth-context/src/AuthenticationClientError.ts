export class AuthenticationClientError extends Error {
  constructor(
    public response: Response,
    public responseBody: string,
    message?: string
  ) {
    super(message ?? `HTTP Error ${response.status}`);
  }
  public readonly isAuthenticationClientError = true;
  /**
   * Explicit check for 401 errors.
   * @returns if status code is 401
   */
  isUnauthorized() {
    return this.response.status === 401;
  }
}
