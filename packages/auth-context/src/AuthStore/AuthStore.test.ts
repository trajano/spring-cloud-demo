import type { OAuthToken } from '../OAuthToken';
import { AuthStore } from './AuthStore';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});

it('should construct and store', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  await authStorage.storeOAuthTokenAndGetExpiresAt({
    access_token: 'abc',
    refresh_token: 'def',
    token_type: 'Bearer',
    expires_in: 423,
  });
  expect(await authStorage.isExpired()).toBe(false);
  expect(await authStorage.getOAuthToken()).toStrictEqual({
    access_token: 'abc',
    refresh_token: 'def',
    token_type: 'Bearer',
    expires_in: 423,
  });

  expect((await authStorage.getTokenExpiresAt()).getTime()).toBeLessThanOrEqual(
    Date.now() + 423 * 1000
  );
  expect((await authStorage.getTokenExpiresAt()).getTime()).toBeGreaterThan(
    Date.now()
  );

  jest.advanceTimersByTime(423 * 1000 - 1);
  expect(await authStorage.isExpired()).toBe(false);
  expect(await authStorage.getAccessToken()).toBe("abc");
  jest.advanceTimersByTime(1);
  expect(await authStorage.getAccessToken()).toBeNull();
  expect(await authStorage.isExpired()).toBe(true);
});
it('should throw an error when sending an empty string', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  try {
    await authStorage.storeOAuthTokenAndGetExpiresAt(
      '' as unknown as OAuthToken
    );
    fail('should not get here');
  } catch (e) {
    expect(e).toStrictEqual(new Error('Token "" is not valid'));
  }
});
it('should throw an error when sending nothing', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  try {
    await authStorage.storeOAuthTokenAndGetExpiresAt(
      null as unknown as OAuthToken
    );
    fail('should not get here');
  } catch (e) {
    expect(e).toStrictEqual(new Error('Token null is not valid'));
  }
});
it('should throw an error when sending invalid token', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  try {
    await authStorage.storeOAuthTokenAndGetExpiresAt({
      not: 'a',
      valid: 'token',
    } as unknown as OAuthToken);
    fail('should not get here');
  } catch (e) {
    expect(e).toStrictEqual(
      new Error('Token {"not":"a","valid":"token"} is not valid')
    );
  }
});
it('should be expired if there is no data', async () => {
  const authStorage = new AuthStore('myKey2', 'https://trajano.net');
  expect(await authStorage.isExpired()).toBe(true);
  expect(await authStorage.getAccessToken()).toBe(null);
  expect((await authStorage.getTokenExpiresAt()).getTime()).toBe(0);
});
afterEach(() => {
  jest.useRealTimers();
});
