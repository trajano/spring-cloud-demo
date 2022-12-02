export type EndpointConfiguration = {
  /**
   * This is the base URL for operations to use.
   */
  baseUrl: URL;
  /**
   * The endpoint that receives the credential data to provide the initial OAuth token.
   */
  authorizationEndpoint: URL;
  /**
   * endpoint that will be called to refresh the access token.
   */
  refreshEndpoint: URL;
  /**
   * endpoint that will be called to revoke the refresh token.
   */
  revocationEndpoint: URL;
  /**
   * endpoint that will be called with a HEAD request to check if the backend is alive or not.
   */
  pingEndpoint: URL;
  /**
   * Client ID.
   */
  clientId: string;
  /**
   * Client secret.
   */
  clientSecret: string;
};
