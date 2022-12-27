import { ReactElement, useEffect, useReducer } from "react";

import { AppLoadingProps } from "./AppLoadingProps";

type LoadingState = {
  loadedAssets: number;
  totalAssets: number;
};
export function AppLoading({
  children,
  LoadingComponent,
  colorScheme,
}: AppLoadingProps): ReactElement<any, any> {
  const [loadingState, notifyLoad] = useReducer(
    (prev: LoadingState, nextLoaded: number) => ({
      totalAssets: prev.loadedAssets,
      loadedAssets: prev.loadedAssets + nextLoaded,
    }),
    { loadedAssets: 0, totalAssets: 1 }
  );
  useEffect(() => {
    notifyLoad(1);
  }, []);
  if (
    loadingState.loadedAssets >= loadingState.totalAssets ||
    !LoadingComponent
  ) {
    return <>children</>;
  } else {
    return (
      <LoadingComponent
        colorScheme={colorScheme}
        loadedAssets={loadingState.loadedAssets}
        totalAssets={loadingState.totalAssets}
      />
    );
  }
}
