/**
 * @module
 *
 */
import { createContext } from "react";
import defaultAppContext from "./default";
import type { IAppContext } from "./IAppContext";

/**
 * The Xyz context.  It is initially set with reasonable defaults to avoid the need for null checks.
 *
 */
export const AppContext = createContext<IAppContext>(defaultAppContext);
