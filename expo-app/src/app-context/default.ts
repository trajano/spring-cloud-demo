import noop from "lodash/noop";

import { IAppContext } from "./IAppContext";

/**
 * Default context implementation that would provide stubs or null object
 * values.
 */
export default {
  lastAuthEvents: [],
  clearLastAuthEvents: noop,
} as IAppContext;
