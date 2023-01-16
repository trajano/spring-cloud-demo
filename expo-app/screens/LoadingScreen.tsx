import { BASE_URL } from "@env";
import { AuthState, useAuth } from "@trajano/spring-docker-auth-context";
import { StatusBar } from "expo-status-bar";
import { checkForUpdateAsync } from "expo-updates";
import AnimatedLottieView from "lottie-react-native";
import { useCallback, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useExpoUpdateEffect } from "../src/hooks/useExpoUpdateEffect";
import {
  LoadingComponentProps,
  Text,
  useTheming,
  View,
} from "../src/lib/native-unstyled";

function AssetsLoaded({
  loadedAssets,
  totalAssets,
  animationDone,
  updateChecked,
}: {
  loadedAssets: number;
  totalAssets: number;
  animationDone: boolean;
  updateChecked: boolean;
}) {
  const { fontsLoaded } = useTheming();
  const { authState, backendReachable, endpointConfiguration } = useAuth();
  const { bottom: safeAreaInsetBottom } = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: safeAreaInsetBottom }}>
      <Text>{`Assets loaded ${loadedAssets}/${totalAssets}`}</Text>
      <Text>{AuthState[authState]}</Text>
      <Text>{fontsLoaded ? "Fonts loaded" : "Fonts not yet loaded"}</Text>
      <Text>{animationDone ? "Animation Done" : "Playing Animation"}</Text>
      <Text>{updateChecked ? "Running latest" : "Checking for update"}</Text>
      <Text>
        {backendReachable ? "Connected" : "Disconnected"}:{" "}
        {endpointConfiguration.pingEndpoint}
      </Text>
      <Text>{BASE_URL}</Text>
    </View>
  );
}

/**
 * This is an exmaple of how NOT to do a loading screen.  The load screen ideally should
 * transition to your app's main screen, but this just spits out debug info.
 */
export function LoadingScreen({
  loadedAssets,
  totalAssets,
  additionalResourceUpdate,
}: LoadingComponentProps) {
  const { colors, fontsLoaded } = useTheming();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const portrait = windowHeight > windowWidth;
  const { authState } = useAuth();
  useExpoUpdateEffect();

  const [fromFontsLoaded, setFromFontsLoaded] = useState(fontsLoaded ? 1 : 0);
  const [fromAuthState, setFromAuthState] = useState(
    authState === AuthState.INITIAL ? 0 : 1
  );
  const [fromExpoUpdate, setFromExpoUpdate] = useState(0);
  const [fromAnimationFinish, setAnimationFinish] = useState(0);

  useEffect(() => {
    setFromFontsLoaded(fontsLoaded ? 1 : 0);
  }, [fontsLoaded]);

  useEffect(() => {
    setFromAuthState(authState === AuthState.INITIAL ? 0 : 1);
  }, [authState]);

  useEffect(() => {
    (async () => {
      try {
        if (!__DEV__) {
          await checkForUpdateAsync();
        }
      } catch (e: unknown) {
        console.warn("Failed to check for update", e);
      } finally {
        setFromExpoUpdate(1);
      }
    })();
  }, [setFromExpoUpdate]);

  const onAnimationFinish = useCallback(() => {
    setAnimationFinish(1);
  }, []);

  useEffect(() => {
    additionalResourceUpdate(
      fromAnimationFinish + fromAuthState + fromExpoUpdate + fromFontsLoaded,
      4
    );
  }, [fromAnimationFinish, fromAuthState, fromExpoUpdate, fromFontsLoaded]);

  return (
    <>
      <View
        width={windowWidth}
        height={windowHeight}
        backgroundColor={colors.default[1]}
        alignItems="center"
        justifyContent="space-between"
      >
        <View flexDirection="row" alignSelf="flex-end">
          <AnimatedLottieView
            autoPlay
            loop={false}
            onAnimationFinish={onAnimationFinish}
            style={{
              width: windowWidth > windowHeight ? windowHeight : windowWidth,
              height: windowWidth > windowHeight ? windowHeight : windowWidth,
            }}
            source={require("../assets/lottie/28839-ikura-sushi.json")}
          />
        </View>
        {portrait && (
          <AssetsLoaded
            loadedAssets={loadedAssets}
            totalAssets={totalAssets}
            updateChecked={fromExpoUpdate === 1}
            animationDone={fromAnimationFinish === 1}
          />
        )}
      </View>
      <StatusBar hidden />
    </>
  );
}
