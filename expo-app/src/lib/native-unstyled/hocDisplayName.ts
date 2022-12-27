import { ComponentType } from "react";

/**
 *
 * @param Component
 */
export function hocDisplayName<Q>(
  hocName: string,
  Component: ComponentType<Q>
): string | undefined {
  if (__DEV__) {
    const displayName = Component.displayName || Component.name || "Component";
    return `${hocName}(${displayName})`;
  } else {
    return Component.displayName;
  }
}
