import { AuthState } from '@trajano/spring-docker-auth-context';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();

  React.useEffect(() => {
    (async () => {
      const nextResult = await Promise.resolve(AuthState.AUTHENTICATED);
      setResult(nextResult);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
