import { FontAwesome } from "@expo/vector-icons";
import * as Font from "expo-font";
import { FontSource } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync().catch(console.error);

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          "space-mono":
            require("../assets/fonts/SpaceMono-Regular.ttf") as FontSource,
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync().catch(console.error);
      }
    }

    loadResourcesAndDataAsync().catch(console.error);
  }, []);

  return isLoadingComplete;
}
