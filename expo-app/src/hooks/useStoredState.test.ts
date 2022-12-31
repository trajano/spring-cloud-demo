import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-hooks";
import { useStoredState } from "./useStoredState";
afterEach(async () => {
  await AsyncStorage.clear();
});
it("should work like normal", () => {
  const { result, unmount } = renderHook(() => useStoredState<string>("foo", "bar"));
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  act(() => setState("foo"));
  [state] = result.current;
  expect(state).toBe("foo");
  unmount();
});

it("should work like normal with async storage check", async () => {
  const { result, waitForNextUpdate, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  // expect(await AsyncStorage.getItem("foo")).toBeNull() cannot be performed as it switches the context
  // and the set state is called during that time causing an `act` warning
  await waitForNextUpdate();
  expect(await AsyncStorage.getItem("foo")).toBe("bar");
  act(() => setState("foo"));
  [state] = result.current;
  expect(state).toBe("foo");
  expect(await AsyncStorage.getItem("foo")).toBe("foo");
  unmount();
});

it("should work like normal with function", async () => {
  const { result, waitForNextUpdate, unmount } = renderHook(() =>
    useStoredState<string>("foo", () => "bar")
  );
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  await waitForNextUpdate();
  expect(await AsyncStorage.getItem("foo")).toBe("bar");
  act(() => {
    setState((prev) => prev + "foo");
  });
  [state] = result.current;
  expect(state).toBe("barfoo");
  expect(await AsyncStorage.getItem("foo")).toBe("barfoo");
  unmount();
});

it("should work restore data from storage using value", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, waitFor, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  // at this point the set state is with "XXX"
  await act(async () => {});
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  // update it as usual
  setState = result.current[1];
  act(() => setState("foo"));
  [state, setState] = result.current;
  expect(state).toBe("foo");
  expect(await AsyncStorage.getItem("foo")).toBe("foo");

  // now update it using the functional version
  act(() => setState((prev) => "BLAH" + prev));
  [state, setState] = result.current;
  expect(state).toBe("BLAHfoo");
  expect(await AsyncStorage.getItem("foo")).toBe("BLAHfoo");

  unmount();
});

it("should work restore data from storage using function initializer", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, waitFor, unmount } = renderHook(() =>
    useStoredState<string>("foo", () => "bar")
  );
  let [state] = result.current;
  expect(state).toBe("bar");
  // at this point the set state is with "XXX"
  await act(async () => {});
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  unmount();
});

it("should work with null initial state and load stored value", async () => {
  const { result, unmount } = renderHook(() => useStoredState("foo", null));
  let [state] = result.current;
  expect(state).toBeNull();
  // at this point the set state is with "XXX"
  await act(async () => {});
  expect(state).toBeNull();
  expect(await AsyncStorage.getItem("foo")).toBeNull();
  unmount();
});

it("should work with null initial state and load stored value", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, waitFor, unmount } = renderHook(() =>
    useStoredState("foo", null)
  );
  let [state] = result.current;
  expect(state).toBeNull();
  // at this point the set state is with "XXX"
  await act(async () => {});
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  unmount();
});

it("should allow clearing an item", async () => {
  await AsyncStorage.setItem("foo", "XXX");
  const { result, waitFor, unmount } = renderHook(() =>
    useStoredState<string>("foo", "bar")
  );
  let [state, setState] = result.current;
  expect(state).toBe("bar");
  // at this point the set state is with "XXX"
  await act(async () => {});
  // now we wait for the render to update
  await waitFor(() => result.current[0] === "XXX");

  // update it as usual
  setState = result.current[1];
  act(() => setState(null));
  [state, setState] = result.current;
  expect(state).toBe(null);
  expect(await AsyncStorage.getItem("foo")).toBeNull();

  // now update it using the functional version
  act(() => setState(() => "BLAH BLAH"));
  [state, setState] = result.current;
  expect(state).toBe("BLAH BLAH");
  expect(await AsyncStorage.getItem("foo")).toBe("BLAH BLAH");

  // now update it using the value version
  act(() => setState("BLEX"));
  [state, setState] = result.current;
  expect(state).toBe("BLEX");
  expect(await AsyncStorage.getItem("foo")).toBe("BLEX");

  unmount();
});
