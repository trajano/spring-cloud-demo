import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCallback,
  useEffect, useState
} from "react";

type NullableString<T extends string> = T | null | undefined;
function resolveInitialState<T extends string>(
  initialState: NullableString<T> | (() => NullableString<T>)
): T | null | undefined {
  let nextState: T | null | undefined;
  if (typeof initialState === "function") {
    nextState = initialState();
  } else {
    nextState = initialState;
  }
  return nextState;
}
/**
 * If the value is null on storage it will not use the state. This is limited to
 * strings.
 *
 * @param storageKey AsyncStorage key
 * @param initialState Initial state if not available in the storage. If it is
 *   in the storage the value in the storage will be used. This may not be
 *   undefined, but may be null
 */
export function useStoredState<T extends string>(
  storageKey: string,
  initialState: T | null | (() => T | null)
): [NullableString<T>, (next: T | null) => Promise<void>] {
  const [state, setState] = useState<T | null>();

  const updateState = useCallback(
    async (nextState: T | null) => {
      if (nextState === null) {
        await AsyncStorage.removeItem(storageKey);
      } else {
        await AsyncStorage.setItem(storageKey, nextState);
      }
      setState(nextState);
    },
    [storageKey, setState]
  );
  useEffect(() => {
    // this will load the data from storage while state is `undefined`
    if (state === undefined) {
      (async () => {
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
      })();
    }
  }, [state]);

  if (state === undefined) {
    const nextState = resolveInitialState(initialState);
    return [nextState, updateState];
  } else {
    return [state, updateState];
  }
}
