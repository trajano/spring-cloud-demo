/**
 * Endpoint configuration.  Note these are `string` to allow JSON serialization.
 */
export type EndpointConfiguration = {
  /**
   * This is the base URL for operations to use.
   */
  baseUrl: string;
  /**
   * The endpoint that receives the credential data to provide the initial OAuth token.
   */
  authorizationEndpoint: string;
  /**
   * endpoint that will be called to refresh the access token.
   */
  refreshEndpoint: string;
  /**
   * endpoint that will be called to revoke the refresh token.
   */
  revocationEndpoint: string;
  /**
   * endpoint that will be called with a HEAD request to check if the backend is alive or not.
   */
  pingEndpoint: string;
  /**
   * Client ID.
   */
  clientId: string;
  /**
   * Client secret.
   */
  clientSecret: string;
};
