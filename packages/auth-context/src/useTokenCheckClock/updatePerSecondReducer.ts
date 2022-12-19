export function updatePerSecondReducer(prev: number, next: number): number {
  /* istanbul ignore next */
  if (__DEV__) {
    if (prev % 1000 !== 0) {
      throw Error(`Existing value ${prev} is not divisible by 1000`);
    }
  }
  if (prev / 1000 === Math.ceil(next / 1000)) {
    return prev;
  } else {
    return Math.ceil(next / 1000) * 1000;
  }
}
