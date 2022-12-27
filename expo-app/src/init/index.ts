/**
 * This is the app entrypoint where the root component is registered and polyfills (if any) are set up.
 */
import "./layout-animation";
import "./start-network-logging";
import "./hideSplash";
import "react-native-gesture-handler";

import { registerRootComponent } from "expo";

import App from "./App";
export default registerRootComponent(App);
