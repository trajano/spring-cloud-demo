import { StatusBar } from 'expo-status-bar';
import AnimatedLottieView from 'lottie-react-native';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';


import { Text, View } from '../src/components';
import { LoadingComponentProps, useTheming } from '../src/lib/native-unstyled';

function AssetsLoaded({ loadedAssets, totalAssets }: Pick<LoadingComponentProps, "loadedAssets" | "totalAssets">) {
  const { bottom: safeAreaInsetBottom } = useSafeAreaInsets();
  return <View paddingBottom={safeAreaInsetBottom}><Text>{`Assets loaded ${loadedAssets}/${totalAssets}`}</Text></View>
}

export function LoadingScreen({ loadedAssets, totalAssets }: LoadingComponentProps) {

  const { colors } = useTheming();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const portrait = windowHeight > windowWidth;
  return (
    <>
      <View style={{ width: windowWidth, height: windowHeight, backgroundColor: colors.default[1], alignItems: "center", justifyContent: "space-between" }}>
        <AnimatedLottieView
          autoPlay
          loop={false}
          style={{
            width: windowWidth > windowHeight ? windowHeight : windowWidth,
            height: windowWidth > windowHeight ? windowHeight : windowWidth,
          }}
          source={require("../assets/lottie/28839-ikura-sushi.json")}
        />
        {portrait && (<AssetsLoaded loadedAssets={loadedAssets} totalAssets={totalAssets} />)}
      </View>
      <StatusBar hidden={true} />
    </>
  );
}
//source={{ uri: "https://assets5.lottiefiles.com/private_files/lf30_e3tmoL.json" }}

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
