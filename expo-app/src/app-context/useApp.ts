import { useContext } from "react";

import { AppContext } from "./AppContext";
import type { IAppContext } from "./IAppContext";

/**
 * Provides the interface to work with the Xyz context.
 *
 * @returns Interface to work with Xyz context
 */
export function useApp(): IAppContext {
  return useContext(AppContext);
}
