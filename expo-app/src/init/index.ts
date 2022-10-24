/**
 * This is the app entrypoint where the root component is registered and polyfills (if any) are set up.
 */
import { registerRootComponent } from "expo";

import './initialize';

import App from "./App";
export default registerRootComponent(App);
