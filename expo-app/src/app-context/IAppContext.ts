import { LoggedAuthEvent } from "./LoggedAuthEvent";

/**
 * Interface that the context would provide. `interface` instead of `type`, this
 * is because a context value is not just a set of values but also functions, so
 * `interface` is a more natural use of it. When this exported it drops the `I`
 * prefix.
 *
 * Even if this can be thought of as an internal representation, exporting it
 * allows TypeDoc to render the documentation.
 *
 * Another approach could be `Xyz` but there's a good likelihood that an
 * existing third-party module will be exposing the same type, as such suffixing
 * it with `Context` mitigates the issue.
 *
 * @internal
 */
export interface IAppContext {
  /**
   * Last auth events. The most recent one will be the first element. This is
   * primarily used to diagnose issues where the token becomes invalidated and
   * the user was forcefully logged out.
   */
  lastAuthEvents: LoggedAuthEvent[];
}
