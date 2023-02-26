import { ComponentType } from "react";

import { HocOptions } from "./HocOptions";

/** @param Component */
export function hocDisplayName<Q>(
  hocName: string,
  Component: ComponentType<Q>,
  hocOptions: HocOptions
): string | undefined {
  if (__DEV__) {
    const displayName =
      hocOptions.displayName ??
      Component.displayName ??
      Component.name ??
      hocOptions.defaultDisplayName;
    return `${hocName}(${displayName})`;
  } else {
    return Component.displayName;
  }
}
