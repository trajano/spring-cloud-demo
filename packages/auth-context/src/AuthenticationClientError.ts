export class AuthenticationClientError extends Error {
  public readonly isAuthenticationClientError = true;
  constructor(
    public response: Response,
    public responseBody: string,
    message?: string
  ) {
    super(message ?? `HTTP Error ${response.status}`);
  }
  /**
   * Explicit check for 401 errors.
   *
   * @returns If status code is 401
   */
  public isUnauthorized(): boolean {
    return this.response.status === 401;
  }
}
