import { useAsyncSetEffect } from "@trajano/react-hooks";
import { Asset } from "expo-asset";
import * as SplashScreen from 'expo-splash-screen';
import { ReactElement, useCallback, useState } from "react";
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
  const onLayout = useCallback(async () => {
    if (initialAssetsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [initialAssetsLoaded])
  useAsyncSetEffect(
    async () => {
      try {
        if (initialAssets) {
          await Asset.loadAsync(initialAssets);
        }
      } catch (e: unknown) {
        console.error(e);
      }
      return true;
    },
    setInitialAssetsLoaded,
    [initialAssets])
  if (loadedAssets >= totalAssets || !LoadingComponent) {
    return <>{children}</>;
  } else if (initialAssetsLoaded) {
    return (
      <LoadingComponent
        onLayout={onLayout}
        loadedAssets={loadedAssets}
        totalAssets={totalAssets}
        additionalResourceUpdate={additionalResourceUpdate}
      />
    );
  } else {
    return <></>
  }
}
