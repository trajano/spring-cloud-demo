/** @module */
import { createContext } from "react";

import type { IAppContext } from "./IAppContext";
import defaultAppContext from "./default";

/**
 * The Xyz context. It is initially set with reasonable defaults to avoid the
 * need for null checks.
 */
export const AppContext = createContext<IAppContext>(defaultAppContext);
