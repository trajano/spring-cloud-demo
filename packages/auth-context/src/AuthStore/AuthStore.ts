import AsyncStorage from '@react-native-async-storage/async-storage';
import { add, isBefore, parseISO, subMilliseconds } from 'date-fns';
import type { OAuthToken } from '../OAuthToken';
import type { IAuthStore } from './IAuthStore';
import { isValidOAuthToken } from './isValidOAuthToken';
export class AuthStore implements IAuthStore {
  /** Storage prefix with the trailing `.` */
  private storagePrefix: string;
  /**
   * @param storagePrefix Storage prefix without the trailing `.`
   * @param baseUrl Base URL appended to the storage prefix.
   */
  constructor(storagePrefix: string, baseUrl: string) {
    this.storagePrefix = `${storagePrefix}.${baseUrl}.`;
  }

  /**
   * Obtains the access token provide if it is available and not expired. This
   * will return null if the token is expired.
   */
  async getAccessTokenAsync(): Promise<string | null> {
    const oauthToken = await this.getOAuthTokenAsync();
    const expiresAt = await this.getTokenExpiresAtAsync();
    if (oauthToken === null || !isBefore(Date.now(), expiresAt)) {
      return null;
    } else {
      return oauthToken.access_token;
    }
  }
  async getOAuthTokenAsync(): Promise<OAuthToken | null> {
    const oauthTokenJson = await AsyncStorage.getItem(
      `${this.storagePrefix}.oauthToken`
    );
    if (oauthTokenJson == null) {
      return null;
    }
    return JSON.parse(oauthTokenJson) as OAuthToken;
  }

  /**
   * @param oauthToken OAuth token to store. This token will be validated for
   *   structure and will throw an error if it is not valid.
   * @returns When the token will expire
   */
  async storeOAuthTokenAndGetExpiresAtAsync(
    oauthToken: OAuthToken
  ): Promise<Date> {
    if (!isValidOAuthToken(oauthToken)) {
      throw new Error(`Token ${JSON.stringify(oauthToken)} is not valid`);
    }
    await AsyncStorage.setItem(
      `${this.storagePrefix}.oauthToken`,
      JSON.stringify(oauthToken)
    );
    const expiresAt = add(Date.now(), {
      seconds: oauthToken.expires_in,
    });
    await AsyncStorage.setItem(
      `${this.storagePrefix}.tokenExpiresAt`,
      expiresAt.toISOString()
    );
    return expiresAt;
  }

  /**
   * Obtains the instant when the token will expire. This will never return
   * null, but may return epoch time.
   */
  async getTokenExpiresAtAsync(): Promise<Date> {
    const tokenExpiresAtString = await AsyncStorage.getItem(
      `${this.storagePrefix}.tokenExpiresAt`
    );
    if (tokenExpiresAtString === null) {
      return new Date(0);
    }
    return parseISO(tokenExpiresAtString);
  }
  /**
   * Checks if the token is expired
   *
   * @returns True if the token is expired. This will never return null and will
   *   return true if there's no token.
   */
  async isExpired(): Promise<boolean> {
    return this.isExpiringInMillis(0);
  }

  /**
   * Checks if the token is expiring or expired in the given number of seconds.
   *
   * @param seconds Seconds before expiration
   * @returns True if the token is expiring or expired. This will never return
   *   null and will return true if there's no token.
   */
  async isExpiringInMillis(millis: number): Promise<boolean> {
    const tokenExpiresAt = await this.getTokenExpiresAtAsync();
    return !isBefore(Date.now(), subMilliseconds(tokenExpiresAt, millis));
  }

  async clearAsync(): Promise<void> {
    await AsyncStorage.multiRemove([
      `${this.storagePrefix}.oauthToken`,
      `${this.storagePrefix}.tokenExpiresAt`,
    ]);
  }
}
