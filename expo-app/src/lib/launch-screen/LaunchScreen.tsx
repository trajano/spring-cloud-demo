import { ComponentType } from "react";
import { LoadingComponentProps } from "../native-unstyled";

type Loader = () => Promise<void>
export type LaunchScreenProps = {
    /**
     * Component to show while the theme and all its resources are being loaded.
     * If not specified, then it shows the children immediately.
     * 
     * This component must style itself to take the whole screen, no styles will be 
     * passed into this component.
     * 
     * Because it is the loading screen, it must only use assets that are loaded in
     * initial assets.
     */
    LoadingComponent?: ComponentType<LoadingComponentProps>;
    /**
     * Assets to initially load.  These have to load before the splash screen is hidden.
     * These are expected to be local resources as such only `number` is allowed.
     * Note that by default Expo treats `json` as code so do not load them as assets
     * even Lottie animation.
     */
    initialAssets?: number | number[]
    /**
     * Additional assets to load after the splash screen his hidden and LoadingComponent is 
     * being shown.  The fonts are appended to the number.  Each of this is a callback
     * function to load an asset or some other object.  This can be used to poll for a stable
     * state.
     */
    additionalAssets?: Loader[];
    /**
     * Minimum amount of time to show the loading screen, used to simulate a long
     * asset load time.
     */
    minimumShowLoadingTime?: number;

}
export function LaunchScreen({ }: LaunchScreenProps) {

}