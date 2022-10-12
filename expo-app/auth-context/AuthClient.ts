import { AuthenticationClientError } from "./AuthenticationClientError";
import base64 from "react-native-base64";
import { OAuthToken } from "./OAuthToken";

export class AuthClient {
  private authorization: string;
  constructor(private baseUrl: string, clientId: string, clientSecret: string) {
    this.authorization = `Basic ${base64.encode(
      clientId + ":" + clientSecret
    )}`;
  }

  public async authenticate(
    authenticationRequest: Record<string, unknown>
  ): Promise<OAuthToken> {
    const response = await fetch(this.baseUrl + "/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authorization,
        Accept: "application/json",
      },
      body: JSON.stringify(authenticationRequest),
    });
    if (!response.ok) {
      throw new AuthenticationClientError(response);
    }
    return response.json();
  }

  public async refresh(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch(this.baseUrl + "/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: this.authorization,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!response.ok) {
      throw new AuthenticationClientError(response);
    }
    return response.json();
  }

  public async logout(refreshToken: string) {
    const response = await fetch(this.baseUrl + "/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: this.authorization,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        token: refreshToken,
        token_type_hint: "refresh_token",
      }),
    });
    if (!response.ok) {
      throw new AuthenticationClientError(response);
    }
    await response.json();
  }
}
