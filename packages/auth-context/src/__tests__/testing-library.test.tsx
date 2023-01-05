import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});
afterEach(cleanup);

function Example() {
  const [name, setUser] = useState('');
  const [show, setShow] = useState(false);

  const onPress = useCallback(() => {
    // let's pretend this is making a server request, so it's async
    // (you'd want to mock this imaginary request in your unit tests)...
    setTimeout(() => {
      setShow(true);
    }, Math.floor(Math.random() * 200));
  }, [setShow]);
  return (
    <View>
      <TextInput value={name} onChangeText={setUser} testID="input" />
      <Pressable onPress={onPress}>
        <Text>Print Username</Text>
      </Pressable>
      {show && <Text testID="printed-username">{name}</Text>}
    </View>
  );
}

test('examples of some things', () => {
  const expectedUsername = 'Ada Lovelace';

  render(<Example />);

  fireEvent.changeText(screen.getByTestId('input'), expectedUsername);
  fireEvent.press(screen.getByText('Print Username'));
  act(() => jest.advanceTimersToNextTimer());
  const usernameOutput = screen.getByTestId('printed-username');

  // Using `toHaveTextContent` matcher from `@testing-library/jest-native` package.
  expect(usernameOutput).toHaveTextContent(expectedUsername);

  expect(screen.toJSON()).toMatchSnapshot();
});
