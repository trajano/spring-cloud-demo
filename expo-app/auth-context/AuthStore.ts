import AsyncStorage from "@react-native-async-storage/async-storage";
import { add, isAfter, parseISO, sub } from "date-fns";
import { OAuthToken } from "./OAuthToken";
export class AuthStore {
  constructor(private storagePrefix: string) {}

  async getOAuthToken(): Promise<OAuthToken | null> {
    const oauthTokenJson = await AsyncStorage.getItem(
      this.storagePrefix + ".oauthToken"
    );
    if (oauthTokenJson == null) {
      return null;
    }
    return JSON.parse(oauthTokenJson) as OAuthToken;
  }

  /**
   *
   * @param oauthToken OAuth token to store
   * @param now now, may be set for testing
   * @returns when the token will expire
   */
  async storeOAuthTokenAndGetExpiresAt(
    oauthToken: OAuthToken,
    now?: Date
  ): Promise<Date> {
    await AsyncStorage.setItem(
      this.storagePrefix + ".oauthToken",
      JSON.stringify(oauthToken)
    );

    const expiresAt = add(now ?? Date.now(), {
      seconds: oauthToken.expires_in,
    });
    await AsyncStorage.setItem(
      this.storagePrefix + ".tokenExpiresAt",
      expiresAt.toISOString()
    );
    return expiresAt;
  }

  /**
   * This will never return null, but may return now.
   */
  async getTokenExpiresAt(): Promise<Date> {
    const tokenExpiresAtString = await AsyncStorage.getItem(
      this.storagePrefix + ".tokenExpiresAt"
    );
    if (tokenExpiresAtString == null) {
      return new Date();
    }
    return parseISO(tokenExpiresAtString);
  }
  async isExpired(now?: Date): Promise<boolean> {
    const tokenExpiresAt = await this.getTokenExpiresAt();
    return isAfter(now ?? Date.now(), tokenExpiresAt);
  }

  /**
   * Checks ifthe token is expiring in the given number of seconds.
   * @param seconds
   * @param now
   * @returns
   */
  async isExpiringInSeconds(seconds: number, now?: Date): Promise<boolean> {
    const tokenExpiresAt = await this.getTokenExpiresAt();
    return isAfter(now ?? Date.now(), sub(tokenExpiresAt, { seconds }));
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.storagePrefix + ".oauthToken",
      this.storagePrefix + ".tokenExpiresAt",
    ]);
  }
}
