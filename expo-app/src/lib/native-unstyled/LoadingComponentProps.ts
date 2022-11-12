import { ColorSchemeName, ViewProps } from "react-native";

export type LoadingComponentProps = ViewProps &
    Partial<{
        colorScheme: NonNullable<ColorSchemeName>;
        totalAssets: number;
        loadedAssets: number;
    }>;
