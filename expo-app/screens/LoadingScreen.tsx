import { AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import { StatusBar } from 'expo-status-bar';
import AnimatedLottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '../src/components';
import { LoadingComponentProps, useTheming } from '../src/lib/native-unstyled';

function AssetsLoaded({ loadedAssets, totalAssets, animationDone }: { loadedAssets: number, totalAssets: number, animationDone: boolean }) {
  const { authState, tokenRefreshable, endpointConfiguration } = useAuth();
  const { bottom: safeAreaInsetBottom } = useSafeAreaInsets();
  return (<View paddingBottom={safeAreaInsetBottom}>
    <Text>{`Assets loaded ${loadedAssets}/${totalAssets}`}</Text>
    <Text>{AuthState[authState]}</Text>
    <Text>{tokenRefreshable ? "Connected" : "Disconnected"} {animationDone ? "Done" : "Playing"}</Text>
    <Text>Ping: {endpointConfiguration?.pingEndpoint}</Text>
  </View>);
}

export function LoadingScreen({ loadedAssets, totalAssets, additionalResourceUpdate }: LoadingComponentProps) {

  const { colors } = useTheming();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const portrait = windowHeight > windowWidth;
  const { authState, tokenRefreshable } = useAuth();
  const [fromTimeout, setFromTimeout] = useState(0);
  const [fromAnimationFinish, setAnimationFinish] = useState(0);
  useEffect(() => {
    // Add a 2 second delayed resource.
    const timeout = setTimeout(() => setFromTimeout(1), 2000);
    if (authState === AuthState.UNAUTHENTICATED || authState === AuthState.AUTHENTICATED) {
      additionalResourceUpdate(1 + fromTimeout + fromAnimationFinish, 3);
    } else if (!tokenRefreshable) {
      additionalResourceUpdate(1 + fromTimeout + fromAnimationFinish, 3);
    } else {
      additionalResourceUpdate(fromTimeout + fromAnimationFinish, 3);
    }
    return () => clearTimeout(timeout);
  }, [authState, tokenRefreshable, fromTimeout, fromAnimationFinish]);

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
        {portrait && (<AssetsLoaded loadedAssets={loadedAssets} totalAssets={totalAssets} animationDone={fromAnimationFinish === 1} />)}
      </View>
      <StatusBar hidden={true} />
    </>
  );
}
