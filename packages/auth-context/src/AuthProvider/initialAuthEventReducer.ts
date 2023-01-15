import type { AuthEvent } from '../AuthEvent';
import { AuthState } from '../AuthState';

export function initialAuthEventReducer(prev: AuthEvent[], current: AuthEvent) {
  if (current.authState !== AuthState.INITIAL) {
    return prev;
  } else {
    return [...prev, current];
  }
}
