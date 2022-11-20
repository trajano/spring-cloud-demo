import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { StatusBar } from 'expo-status-bar';
import AnimatedLottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '../src/components';
import { LoadingComponentProps, useTheming } from '../src/lib/native-unstyled';

function AssetsLoaded({ loadedAssets, totalAssets }: Pick<LoadingComponentProps, "loadedAssets" | "totalAssets">) {
  const { bottom: safeAreaInsetBottom } = useSafeAreaInsets();
  return <View paddingBottom={safeAreaInsetBottom}><Text>{`Assets loaded ${loadedAssets}/${totalAssets}`}</Text></View>
}

export function LoadingScreen({ loadedAssets, totalAssets, additionalResourceUpdate }: LoadingComponentProps) {

  const { colors } = useTheming();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const portrait = windowHeight > windowWidth;
  const { authState, isConnected } = useAuth();
  const [fromTimeout, setFromTimeout] = useState(0);
  const [fromAnimationFinish, setAnimationFinish] = useState(0);
  useEffect(() => {
    // Add a 2 second delayed resource.
    const timeout = setTimeout(() => setFromTimeout(1), 2000);
    if (authState === AuthState.UNAUTHENTICATED || authState === AuthState.AUTHENTICATED) {
      additionalResourceUpdate(1 + fromTimeout + fromAnimationFinish, 3);
    } else if (!isConnected) {
      additionalResourceUpdate(1 + fromTimeout + fromAnimationFinish, 3);
    } else {
      additionalResourceUpdate(fromTimeout + fromAnimationFinish, 3);
    }
    return () => clearTimeout(timeout);
  }, [authState, isConnected, fromTimeout, fromAnimationFinish]);

  return (
    <>
      <View style={{ width: windowWidth, height: windowHeight, backgroundColor: colors.default[1], alignItems: "center", justifyContent: "space-between" }}>
        <View flexDirection='row' alignSelf="flex-end">
          <AnimatedLottieView
            autoPlay
            loop={false}
            onAnimationFinish={() => { setAnimationFinish(1); }}
            style={{
              width: windowWidth > windowHeight ? windowHeight : windowWidth,
              height: windowWidth > windowHeight ? windowHeight : windowWidth,
            }}
            source={require("../assets/lottie/28839-ikura-sushi.json")}
          />
        </View>
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
