import { isTokenExpired } from './isTokenExpired';
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
});
afterEach(() => {
  jest.useRealTimers();
});
it('Expired on the spot', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
  expect(isTokenExpired(new Date('2022-01-01T00:00:00Z'), 10000)).toBeTruthy();
});

it('Expired in window', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));
  expect(isTokenExpired(new Date('2022-01-01T00:00:10Z'), 10000)).toBeTruthy();
});

it('Expired in window with advancing timers', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));

  const expiresAt = new Date('2022-01-01T00:00:20Z');
  expect(isTokenExpired(expiresAt, 10000)).toBeFalsy();
  jest.advanceTimersByTime(9000);
  expect(isTokenExpired(expiresAt, 10000)).toBeFalsy();
  jest.advanceTimersByTime(999);
  expect(isTokenExpired(expiresAt, 10000)).toBeFalsy();
  jest.advanceTimersByTime(1);
  expect(isTokenExpired(expiresAt, 10000)).toBeTruthy();
});

it('Expired when null', async () => {
  jest.setSystemTime(new Date('2022-01-01T00:00:00Z'));

  expect(isTokenExpired(null, 10000)).toBeTruthy();
});
