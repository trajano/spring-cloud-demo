import { StyleSheet } from 'react-native';

import { Text, View } from '@components';
import { useTheming } from '../src/lib/native-unstyled';

export default function TabTwoScreen() {
  const { colorScheme } = useTheming()
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Tab Two</Text> */}
      {/* <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" /> */}
      {/* <Text>Hello world <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text></Text> */}
      <Text fg="white" style={{ fontFamily: "IBMPlexSans", fontSize: 30 }}>Hello world <Text style={{ fontWeight: "bold" }}>bold</Text> <Text style={{ fontStyle: "italic" }}>italic</Text> {colorScheme}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
