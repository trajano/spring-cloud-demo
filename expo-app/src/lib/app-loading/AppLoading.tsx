import { Asset } from "expo-asset";
import * as SplashScreen from 'expo-splash-screen';
import { ReactElement, useCallback, useEffect, useState } from "react";
import { View } from 'react-native';
import { AppLoadingProps } from "./AppLoadingProps";
export function AppLoading({
  children,
  initialAssets,
  LoadingComponent
}: AppLoadingProps): ReactElement<any, any> {
  const [initialAssetsLoaded, setInitialAssetsLoaded] = useState(initialAssets !== undefined);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [totalAssets, setTotalAssets] = useState(!!LoadingComponent ? 1 : 0);
  const additionalResourceUpdate = useCallback((loaded: number, total: number) => {
    setLoadedAssets(loaded);
    setTotalAssets(total);
  }, [])
  const onLayout = useCallback(function onLayout() {
    console.log({ onLayout: "fired", initialAssetsLoaded })
    if (initialAssetsLoaded) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [initialAssetsLoaded])
  useEffect(() => {
    if (initialAssets) {
      Asset.loadAsync(initialAssets).then(() => setInitialAssetsLoaded(true)).catch(console.error);
    } else {
      setInitialAssetsLoaded(true)
    }
  }, [initialAssets]);
  if (loadedAssets >= totalAssets || !LoadingComponent) {
    return <>{children}</>;
  } else if (initialAssetsLoaded) {
    return (
      <View onLayout={onLayout}>
        <LoadingComponent
          loadedAssets={loadedAssets}
          totalAssets={totalAssets}
          additionalResourceUpdate={additionalResourceUpdate}
        />
      </View>
    );
  } else {
    return <></>
  }
}
