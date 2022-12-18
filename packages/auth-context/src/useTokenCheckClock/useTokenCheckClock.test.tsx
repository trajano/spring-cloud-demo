import { renderHook } from '@testing-library/react-hooks';
import { add } from 'date-fns';
import { act } from 'react-test-renderer';
import { AuthState } from '..';
import { useTokenCheckClock } from './useTokenCheckClock';
const specimenTime = new Date("2025-01-01T03:00:00Z")
beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.setSystemTime(specimenTime);
});
it("initial will not trigger any further updates aside from the initial state", () => {
  const { result } = renderHook(() => useTokenCheckClock(AuthState.INITIAL, null, 10000), {})
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime())
  jest.advanceTimersByTime(60000);
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime())
})

it("test with BACKEND_FAILURE", () => {
  const { result } = renderHook(() => useTokenCheckClock(AuthState.BACKEND_FAILURE, null, 10000), {})
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime())
  jest.advanceTimersByTime(59999);
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime())
  act(() => jest.advanceTimersByTime(1))
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime() + 60000)
})

it("test with AUTHENTICATED", () => {
  const expiresAt = add(specimenTime, { seconds: 120 })

  const { result } = renderHook(() => useTokenCheckClock(AuthState.AUTHENTICATED, expiresAt, 10000), {})
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime())
  jest.advanceTimersByTime(59999);
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime())
  act(() => jest.advanceTimersByTime(1))
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime() + 60000)

  // early trigger by 10 seconds
  jest.advanceTimersByTime(49999);
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime() + 60000)
  act(() => jest.advanceTimersByTime(1))
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime() + 60000 + 50000)

  // no more after that
  act(() => jest.advanceTimersByTime(60000))
  expect(result.current.lastCheckTime).toBe(specimenTime.getTime() + 60000 + 50000)
})

afterEach(() => {
  jest.useRealTimers();
})
