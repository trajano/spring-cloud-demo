import { timeToNextExpirationCheck } from './timeToNextExpirationCheck';

beforeEach(() => jest.useFakeTimers());
afterAll(() => jest.useRealTimers());
it('should handle future time', () => {
  expect(
    timeToNextExpirationCheck(new Date(Date.now() + 2000), 100, 60000)
  ).toBe(1900);
});

it('should cap to max', () => {
  expect(
    timeToNextExpirationCheck(new Date(Date.now() + 200000), 100, 60000)
  ).toBe(60000);
});

it('should handle edge case of zero due to time before expiration refresh', () => {
  expect(
    timeToNextExpirationCheck(new Date(Date.now() + 200), 200, 60000)
  ).toBe(0);
});

it('should handle edge case of zero with zero time before expiration refresh', () => {
  expect(timeToNextExpirationCheck(new Date(), 0, 60000)).toBe(0);
});

it('should handle edge case of -1 with zero time before expiration refresh', () => {
  expect(timeToNextExpirationCheck(new Date(Date.now() - 1), 0, 60000)).toBe(0);
});

it('should case where it is expire past the limit with time before expiration refresh', () => {
  expect(
    timeToNextExpirationCheck(new Date(Date.now() + 200), 500, 60000)
  ).toBe(0);
});
