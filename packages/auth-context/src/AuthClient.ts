import { AuthenticationClientError } from './AuthenticationClientError';
import { basicAuthorization } from './basicAuthorization';
import type { EndpointConfiguration } from './EndpointConfiguration';
import type { OAuthToken } from './OAuthToken';

export interface IAuthClient<A = any> {
  authenticate(authenticationRequest: A): Promise<OAuthToken>;
  refresh(refreshToken: string): Promise<OAuthToken>;
  revoke(refreshToken: string): Promise<void>;
}
export class AuthClient implements IAuthClient<Record<string, unknown>> {
  /**
   * Header value.
   */
  private authorization: string;
  private authorizationEndpoint: URL;
  private refreshEndpoint: URL;
  private revocationEndpoint: URL;
  /**
   * The endpoints are converted from string to URLs to ensure they are valid.
   * @param endpointConfiguration endpoint configuration
   */
  constructor(endpointConfiguration: EndpointConfiguration) {
    this.authorization = basicAuthorization(
      endpointConfiguration.clientId,
      endpointConfiguration.clientSecret
    );
    this.authorizationEndpoint = new URL(
      endpointConfiguration.authorizationEndpoint
    );
    this.refreshEndpoint = new URL(endpointConfiguration.refreshEndpoint);
    this.revocationEndpoint = new URL(endpointConfiguration.revocationEndpoint);
  }

  public async authenticate(
    authenticationRequest: Record<string, unknown>
  ): Promise<OAuthToken> {
    const response = await fetch(this.authorizationEndpoint.href, {
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
    return response.json();
  }

  public async refresh(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch(this.refreshEndpoint.href, {
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
    const response = await fetch(this.revocationEndpoint.href, {
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
