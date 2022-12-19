import { isTokenRefExpired } from './isTokenRefExpired';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});
afterEach(() => {
  jest.useRealTimers();
});
it('Expired on the spot', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
  expect(
    isTokenRefExpired({ current: new Date('2022-01-01T00:00:00Z') }, 10000)
  ).toBeTruthy();
});

it('Expired in window', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
  expect(
    isTokenRefExpired({ current: new Date('2022-01-01T00:00:10Z') }, 10000)
  ).toBeTruthy();
});

it('Expired in window with advancing timers', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));

  const expiresAtRef = { current: new Date('2022-01-01T00:00:20Z') };
  expect(isTokenRefExpired(expiresAtRef, 10000)).toBeFalsy();
  jest.advanceTimersByTime(9000);
  expect(isTokenRefExpired(expiresAtRef, 10000)).toBeFalsy();
  jest.advanceTimersByTime(999);
  expect(isTokenRefExpired(expiresAtRef, 10000)).toBeFalsy();
  jest.advanceTimersByTime(1);
  expect(isTokenRefExpired(expiresAtRef, 10000)).toBeTruthy();
});

it('Expired when no ref', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));

  const expiresAtRef = { current: null };
  expect(isTokenRefExpired(expiresAtRef, 10000)).toBeTruthy();
});
