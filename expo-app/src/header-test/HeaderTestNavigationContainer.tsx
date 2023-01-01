import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { useTheming } from "../lib/native-unstyled";
import { MainTabNavigation, MainTabParamList } from "./MainTabNavigation";

export function HeaderTestNavigationContainer() {
  const { reactNavigationTheme } = useTheming();
  useEffect(() => {
    SplashScreen.hideAsync().catch(console.error);
  });
  return (
    <NavigationContainer<MainTabParamList> theme={reactNavigationTheme}>
      <MainTabNavigation />
    </NavigationContainer>
  );
}
