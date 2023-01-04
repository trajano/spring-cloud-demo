import type { OAuthToken } from '../OAuthToken';
import { AuthStore } from './AuthStore';
afterEach(() => {
  jest.useRealTimers();
});
it('should construct and store', async () => {
  jest.useFakeTimers({ advanceTimers: true });
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  await authStorage.storeOAuthTokenAndGetExpiresAtAsync({
    access_token: 'abc',
    refresh_token: 'def',
    token_type: 'Bearer',
    expires_in: 423,
  });
  expect(await authStorage.isExpired()).toBe(false);
  expect(await authStorage.getOAuthTokenAsync()).toStrictEqual({
    access_token: 'abc',
    refresh_token: 'def',
    token_type: 'Bearer',
    expires_in: 423,
  });

  expect(
    (await authStorage.getTokenExpiresAtAsync()).getTime()
  ).toBeLessThanOrEqual(Date.now() + 423 * 1000);
  expect(
    (await authStorage.getTokenExpiresAtAsync()).getTime()
  ).toBeGreaterThan(Date.now());

  jest.advanceTimersByTime(423 * 1000 - 1);
  expect(await authStorage.isExpired()).toBe(false);
  expect(await authStorage.getAccessTokenAsync()).toBe('abc');
  jest.advanceTimersByTime(1);
  expect(await authStorage.getAccessTokenAsync()).toBeNull();
  expect(await authStorage.isExpired()).toBe(true);
});
it('should throw an error when sending an empty string', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  await expect(async () => {
    await authStorage.storeOAuthTokenAndGetExpiresAtAsync(
      '' as unknown as OAuthToken
    );
  }).rejects.toThrow(new Error('Token "" is not valid'));
});
it('should throw an error when sending nothing', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  await expect(async () => {
    await authStorage.storeOAuthTokenAndGetExpiresAtAsync(
      null as unknown as OAuthToken
    );
  }).rejects.toThrow(new Error('Token null is not valid'));
});
it('should throw an error when sending invalid token', async () => {
  const authStorage = new AuthStore('myKey', 'https://trajano.net');
  await expect(async () => {
    await authStorage.storeOAuthTokenAndGetExpiresAtAsync({
      not: 'a',
      valid: 'token',
    } as unknown as OAuthToken);
  }).rejects.toThrow(
    new Error('Token {"not":"a","valid":"token"} is not valid')
  );
});
it('should be expired if there is no data', async () => {
  const authStorage = new AuthStore('myKey2', 'https://trajano.net');
  expect(await authStorage.isExpired()).toBe(true);
  expect(await authStorage.getAccessTokenAsync()).toBe(null);
  expect((await authStorage.getTokenExpiresAtAsync()).getTime()).toBe(0);
});
