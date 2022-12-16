import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

afterEach(cleanup);

function Example() {
  const [name, setUser] = useState('')
  const [show, setShow] = useState(false)

  return (
    <View>
      <TextInput value={name} onChangeText={setUser} testID="input" />
      <Pressable
        onPress={() => {
          // let's pretend this is making a server request, so it's async
          // (you'd want to mock this imaginary request in your unit tests)...
          setTimeout(() => {
            setShow(true)
          }, Math.floor(Math.random() * 200))
        }}
      >
        <Text>Print Username</Text>
      </Pressable>
      {show && <Text testID="printed-username">{name}</Text>}
    </View >
  )
}

test('examples of some things', async () => {
  const expectedUsername = 'Ada Lovelace'

  render(<Example />)

  fireEvent.changeText(screen.getByTestId('input'), expectedUsername)
  fireEvent.press(screen.getByText('Print Username'))

  // Using `findBy` query to wait for asynchronous operation to finish
  const usernameOutput = await screen.findByTestId('printed-username')

  // Using `toHaveTextContent` matcher from `@testing-library/jest-native` package.
  expect(usernameOutput).toHaveTextContent(expectedUsername)

  expect(screen.toJSON()).toMatchSnapshot()
})
