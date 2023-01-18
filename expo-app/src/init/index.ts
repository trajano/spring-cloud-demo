/**
 * This is the app entrypoint where the root component is registered and polyfills (if any) are set up.
 */
import "react-native-gesture-handler";
import "./hideSplash";
import "./layout-animation";
import "./start-network-logging";

import { registerRootComponent } from "expo";

import App from "./App";
export default registerRootComponent(App);
