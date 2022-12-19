import { updatePerSecondReducer } from './updatePerSecondReducer';

it('should handle equal values', () => {
  expect(updatePerSecondReducer(1000, 1000)).toBe(1000);
});

it('off by 1 triggers next', () => {
  expect(updatePerSecondReducer(1000, 1001)).toBe(2000);
});

it('off by 1 but in current block should not trigger', () => {
  expect(updatePerSecondReducer(2000, 1001)).toBe(2000);
});
it('should throw an error if the current value is not divisble by 1000', () => {
  try {
    updatePerSecondReducer(1001, 1001);
    fail("should not get here");
  } catch (e) {
    expect(e).toStrictEqual(new Error("Existing value 1001 is not divisible by 1000"));
  }
});
