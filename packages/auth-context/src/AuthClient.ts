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
  /**
   *
   * @param endpointConfiguration endpoint configuration
   */
  constructor(private endpointConfiguration: EndpointConfiguration) {
    this.authorization = basicAuthorization(
      this.endpointConfiguration.clientId,
      this.endpointConfiguration.clientSecret
    );
  }

  public async authenticate(
    authenticationRequest: Record<string, unknown>
  ): Promise<OAuthToken> {
    const response = await fetch(
      this.endpointConfiguration.authorizationEndpoint.href,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authorization,
          'Accept': 'application/json',
        },
        body: JSON.stringify(authenticationRequest),
      }
    );
    if (!response.ok) {
      throw new AuthenticationClientError(response);
    }
    return response.json();
  }

  public async refresh(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch(
      this.endpointConfiguration.refreshEndpoint.href,
      {
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
      }
    );
    if (!response.ok) {
      throw new AuthenticationClientError(response);
    }
    return response.json();
  }

  public async revoke(refreshToken: string) {
    const response = await fetch(
      this.endpointConfiguration.revocationEndpoint.href,
      {
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
      }
    );
    if (!response.ok) {
      throw new AuthenticationClientError(response);
    }
    await response.json();
  }
}
