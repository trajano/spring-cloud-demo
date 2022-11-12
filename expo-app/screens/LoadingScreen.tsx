import AnimatedLottieView from 'lottie-react-native';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { Text, View } from '../src/components';

export function LoadingScreen() {

  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  return (
    <View style={{ width: windowWidth, height: windowHeight, backgroundColor: "pink", alignItems: "center", justifyContent: "flex-start" }}>
      <AnimatedLottieView
        autoPlay
        loop={false}
        style={{
          width: windowWidth > windowHeight ? windowHeight : windowWidth,
          height: windowWidth > windowHeight ? windowHeight : windowWidth,
        }}
        source={{ uri: "https://assets5.lottiefiles.com/private_files/lf30_e3tmoL.json" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
