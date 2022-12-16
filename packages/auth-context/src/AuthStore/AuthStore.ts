import AsyncStorage from '@react-native-async-storage/async-storage';
import { add, isBefore, parseISO, sub } from 'date-fns';
import type { OAuthToken } from '../OAuthToken';
import { isTokenValid } from './isTokenValid';
export class AuthStore {
  /**
   * Storage prefix with the trailing `.`
   */
  private storagePrefix: string;
  /**
   *
   * @param storagePrefix storage prefix without the trailing `.`
   * @param baseUrl base URL appended to the storage prefix.
   */
  constructor(storagePrefix: string, baseUrl: string) {
    this.storagePrefix = `${storagePrefix}.${baseUrl}.`;
  }

  /**
   * Obtains the access token provide if it is available and not expired.  This will return null if the token is expired.
   */
  async getAccessToken(): Promise<string | null> {
    const oauthToken = await this.getOAuthToken();
    const expiresAt = await this.getTokenExpiresAt();
    if (oauthToken === null || !isBefore(Date.now(), expiresAt)) {
      return null;
    } else {
      return oauthToken.access_token;
    }
  }
  async getOAuthToken(): Promise<OAuthToken | null> {
    const oauthTokenJson = await AsyncStorage.getItem(
      this.storagePrefix + '.oauthToken'
    );
    if (oauthTokenJson == null) {
      return null;
    }
    return JSON.parse(oauthTokenJson) as OAuthToken;
  }

  /**
   *
   * @param oauthToken OAuth token to store.  This token will be validated for structure and will throw an error if it is not valid.
   * @returns when the token will expire
   */
  async storeOAuthTokenAndGetExpiresAt(oauthToken: OAuthToken): Promise<Date> {
    if (!isTokenValid(oauthToken)) {
      throw new Error(`Token ${JSON.stringify(oauthToken)} is not valid`);
    }
    await AsyncStorage.setItem(
      this.storagePrefix + '.oauthToken',
      JSON.stringify(oauthToken)
    );
    const expiresAt = add(Date.now(), {
      seconds: oauthToken.expires_in,
    });
    await AsyncStorage.setItem(
      this.storagePrefix + '.tokenExpiresAt',
      expiresAt.toISOString()
    );
    return expiresAt;
  }

  /**
   * Obtains the instant when the token will expire.  This will never return null, but may return epoch time.
   */
  async getTokenExpiresAt(): Promise<Date> {
    const tokenExpiresAtString = await AsyncStorage.getItem(
      this.storagePrefix + '.tokenExpiresAt'
    );
    if (tokenExpiresAtString === null) {
      return new Date(0);
    }
    return parseISO(tokenExpiresAtString);
  }
  /**
   * Checks if the token is expired
   * @returns true if the token is expired.  This will never return null and will return true if there's no token.
   */
  async isExpired(): Promise<boolean> {
    return this.isExpiringInSeconds(0);
  }

  /**
   * Checks if the token is expiring or expired in the given number of seconds.
   * @param seconds seconds before expiration
   * @returns true if the token is expiring or expired.  This will never return null and will return true if there's no token.
   */
  async isExpiringInSeconds(seconds: number): Promise<boolean> {
    const tokenExpiresAt = await this.getTokenExpiresAt();
    return !isBefore(Date.now(), sub(tokenExpiresAt, { seconds }));
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.storagePrefix + '.oauthToken',
      this.storagePrefix + '.tokenExpiresAt',
    ]);
  }
}
