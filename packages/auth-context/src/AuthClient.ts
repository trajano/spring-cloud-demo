import { AuthenticationClientError } from './AuthenticationClientError';
import { basicAuthorization } from './basicAuthorization';
import type { EndpointConfiguration } from './EndpointConfiguration';
import type { OAuthToken } from './OAuthToken';

export interface IAuthClient<A = any> {
  authenticateAsync(authenticationRequest: A): Promise<[OAuthToken, Response]>;
  refreshAsync(refreshToken: string): Promise<OAuthToken>;
  revokeAsync(refreshToken: string): Promise<void>;
}
export class AuthClient<A = any> implements IAuthClient<A> {
  /**
   * Header value.
   */
  private authorization: string;
  /**
   * Authorization end point
   */
  private authorizationEndpoint: string;
  private refreshEndpoint: string;
  private revocationEndpoint: string;
  /**
   * The endpoints are not converted from string to URLs to ensure they are valid due to an issue
   * https://github.com/expo/expo/issues/15868
   * @param endpointConfiguration endpoint configuration
   */
  constructor(endpointConfiguration: EndpointConfiguration) {
    this.authorization = basicAuthorization(
      endpointConfiguration.clientId,
      endpointConfiguration.clientSecret
    );
    this.authorizationEndpoint = endpointConfiguration.authorizationEndpoint;
    this.refreshEndpoint = endpointConfiguration.refreshEndpoint;
    this.revocationEndpoint = endpointConfiguration.revocationEndpoint;
  }

  /**
   * This extracts the body from the response as .text() rather than .json()
   * so error handlers can use it to get the content that was sent as-is.
   *
   * It may be slower, but this ensures we do not lose useful data for debugging.
   *
   * This also handles the responsibility of assembling the client error.
   * @param response response
   */
  private async resolveJson<X>(response: Response): Promise<X> {
    const responseBody = await response.text();
    try {
      return JSON.parse(responseBody) as X;
    } catch (e) {
      throw new AuthenticationClientError(
        response,
        responseBody,
        'unable to parse response as JSON'
      );
    }
  }

  /**
   * Calls the API endpoint to authenticate.
   * @param authenticationRequest
   * @returns [ OAuthToken, Response ]
   * @throws AuthenticationClientError
   */
  public async authenticateAsync(
    authenticationRequest: A
  ): Promise<[OAuthToken, Response]> {
    const response = await fetch(this.authorizationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authorization,
        'Accept': 'application/json',
      },
      body: JSON.stringify(authenticationRequest),
    });
    if (!response.ok) {
      throw new AuthenticationClientError(response, await response.text());
    }
    return [await this.resolveJson<OAuthToken>(response), response];
  }

  public async refreshAsync(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch(this.refreshEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': this.authorization,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });
    if (!response.ok) {
      throw new AuthenticationClientError(response, await response.text());
    }
    return this.resolveJson<OAuthToken>(response);
  }

  public async revokeAsync(refreshToken: string) {
    const response = await fetch(this.revocationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': this.authorization,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        token: refreshToken,
        token_type_hint: 'refresh_token',
      }).toString(),
    });
    if (!response.ok) {
      throw new AuthenticationClientError(response, await response.text());
    }
    return this.resolveJson<any>(response);
  }
}
