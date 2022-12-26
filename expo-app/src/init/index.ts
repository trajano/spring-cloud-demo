/**
 * This is the app entrypoint where the root component is registered and polyfills (if any) are set up.
 */
import "./layout-animation.android";
import "./start-network-logging";
import "react-native-gesture-handler";

import { registerRootComponent } from "expo";

import App from "./App";
export default registerRootComponent(App);
