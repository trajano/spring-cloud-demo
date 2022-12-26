import { AuthState } from '../AuthState';
import type { AuthEvent } from '../AuthEvent';

export function initialAuthEventReducer(prev: AuthEvent[], current: AuthEvent) {
  if (current.authState !== AuthState.INITIAL) {
    return prev;
  } else {
    return [...prev, current];
  }
}
