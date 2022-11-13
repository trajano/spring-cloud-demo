import { AuthenticationClientError } from './AuthenticationClientError';
import base64url from 'base64url';
import type { OAuthToken } from './OAuthToken';

export interface IAuthClient<A = any> {
  authenticate(authenticationRequest: A): Promise<OAuthToken>;
  refresh(refreshToken: string): Promise<OAuthToken>;
  revoke(refreshToken: string): Promise<void>;
  ping(): Promise<boolean>;
}
export class AuthClient implements IAuthClient<Record<string, unknown>> {
  /**
   * Header value.
   */
  private authorization: string;
  constructor(private baseUrl: URL, clientId: string, clientSecret: string) {
    this.authorization = `Basic ${base64url.toBase64(
      clientId + ':' + clientSecret
    )}`;
  }

  public async authenticate(
    authenticationRequest: Record<string, unknown>
  ): Promise<OAuthToken> {
    const response = await fetch(new URL('/auth', this.baseUrl.href).href, {
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
    const response = await fetch(new URL('/refresh', this.baseUrl.href).href, {
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
    const response = await fetch(new URL('/logout', this.baseUrl.href).href, {
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

  public async ping(): Promise<boolean> {
    const response = await fetch(new URL('/ping', this.baseUrl.href).href, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      return false;
    }
    const resp = (await response.json()) as { ok: boolean };
    return resp.ok;
  }
}
