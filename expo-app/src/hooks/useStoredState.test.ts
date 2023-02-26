/** @jest-environment node */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { useStoredState } from "./useStoredState";
afterEach(async () => {
  await AsyncStorage.clear();
});
it("validate useState", async () => {
  const { result, unmount } = renderHook(() => useState<string>("bar"));
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  await act(async () => {
    setState("foo");
  });
  [state] = result.current;
  expect(state).toBe("foo");
  unmount();
});
it("should work like useState", async () => {
  const { result, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setStateAsync] = result.current;
  expect(state).toBe("bar");
  await act(() => Promise.resolve());

  await act(async () => {
    await setStateAsync("foo");
  });
  await act(() => Promise.resolve());

  [state] = result.current;
  expect(state).toBe("foo");
  unmount();
});

it("should work like normal with async storage check", async () => {
  const { result, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  await act(() => Promise.resolve());
  /*
   * expect(await AsyncStorage.getItem("foo")).toBeNull() cannot be performed as it switches the context
   * and the set state is called during that time causing an `act` warning
   */
  expect(await AsyncStorage.getItem("foo")).toBe("bar");
  await act(() => setState("foo"));
  [state] = result.current;
  expect(state).toBe("foo");
  expect(await AsyncStorage.getItem("foo")).toBe("foo");
  unmount();
});

it("should work restore data from storage using value", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  // at this point the set state is with "XXX"
  await act(() => Promise.resolve());
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  // update it as usual
  setState = result.current[1];
  await act(() => setState("foo"));
  [state, setState] = result.current;
  expect(state).toBe("foo");
  expect(await AsyncStorage.getItem("foo")).toBe("foo");

  unmount();
});

it("should work restore data from storage using function initializer", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, unmount } = renderHook(() =>
    useStoredState<string>("foo", () => "bar")
  );
  const [state] = result.current;
  expect(state).toBe("bar");
  // at this point the set state is with "XXX"
  await act(() => Promise.resolve());
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  unmount();
});

it("should work with null initial state", async () => {
  const { result, unmount } = renderHook(() => useStoredState("foo", null));
  const [state] = result.current;
  expect(state).toBeNull();
  await act(() => Promise.resolve());
  expect(state).toBeNull();
  expect(await AsyncStorage.getItem("foo")).toBeNull();
  unmount();
});

it("should work with null initial state and load stored value", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, unmount } = renderHook(() => useStoredState("foo", null));
  const [state] = result.current;
  expect(state).toBeNull();
  // at this point the set state is with "XXX"
  await act(() => Promise.resolve());
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  unmount();
});

it("should allow clearing an item", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setStateAsync] = result.current;
  expect(state).toBe("bar");
  // at this point the set state is with "XXX"
  await act(() => Promise.resolve());
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  // update it as usual
  setStateAsync = result.current[1];
  await act(async () => { await setStateAsync(null) });
  [state, setStateAsync] = result.current;
  expect(state).toBe(null);
  expect(await AsyncStorage.getItem("foo")).toBeNull();

  // now update it using the value version
  await act(() => setStateAsync("BLEX"));
  [state, setStateAsync] = result.current;
  expect(state).toBe("BLEX");
  expect(await AsyncStorage.getItem("foo")).toBe("BLEX");

  unmount();
});
