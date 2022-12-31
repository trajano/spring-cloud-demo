import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

function resolveInitialState<T extends string | null | undefined>(
  initialState: T | (() => T)
): T {
  let nextState: T;
  if (typeof initialState === "function") {
    nextState = initialState();
  } else {
    nextState = initialState;
  }
  return nextState;
}
/**
 * If the value is null on storage it will not use the state.  This is limited to strings.
 * @param storageKey AsyncStorage key
 * @param initialState initial state if not available in the storage.  If it is in the storage the value in the storage will be used.  This may not be undefined.
 */
export function useStoredState<T extends string | null | undefined>(
  storageKey: string,
  initialState: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>();
  useEffect(() => {
    (async () => {
      if (state === undefined) {
        const val = (await AsyncStorage.getItem(storageKey)) as T;
        if (val !== null) {
          setState(val);
        } else {
          const nextState = resolveInitialState(initialState);
          if (nextState) {
            await AsyncStorage.setItem(storageKey, nextState);
          }
          setState(nextState);
        }
      } else if (state === null) {
        await AsyncStorage.removeItem(storageKey);
      } else {
        await AsyncStorage.setItem(storageKey, state);
      }
    })();
  }, [storageKey, setState, state, initialState]);
  if (state !== undefined) {
    return [state, setState as Dispatch<SetStateAction<T>>];
  } else {
    const nextState = resolveInitialState(initialState);
    return [nextState, setState as Dispatch<SetStateAction<T>>];
  }
}
