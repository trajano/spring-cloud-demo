import { AuthenticationClientError } from './AuthenticationClientError';
import { basicAuthorization } from './basicAuthorization';
import type { EndpointConfiguration } from './EndpointConfiguration';
import type { OAuthToken } from './OAuthToken';

export interface IAuthClient<A = any> {
  authenticate(authenticationRequest: A): Promise<[OAuthToken, Response]>;
  refresh(refreshToken: string): Promise<OAuthToken>;
  revoke(refreshToken: string): Promise<void>;
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
   * Calls the API endpoint to authenticate.
   * @param authenticationRequest
   * @returns [ OAuthToken, Response ]
   * @throws AuthenticationClientError
   */
  public async authenticate(
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
      throw new AuthenticationClientError(response);
    }
    return [await response.json(), response];
  }

  public async refresh(refreshToken: string): Promise<OAuthToken> {
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
      throw new AuthenticationClientError(response);
    }
    return response.json();
  }

  public async revoke(refreshToken: string) {
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
      throw new AuthenticationClientError(response);
    }
    await response.json();
  }
}
