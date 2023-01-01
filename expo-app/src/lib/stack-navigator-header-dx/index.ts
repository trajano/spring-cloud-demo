/**
 * This is a header that is meant to be used with Stack navigator.  It's more of a template rather than a full
 * header UI.  But will allow various animations to be put on top of it.
 *
 * The general concept is a Stack Navigator Screen would have the following components
 * - Header Area
 *   - refresh zone
 *   - header title zone
 *   - large header title zone
 *   - notification zone
 * - Content Area (which is usually a scroll view and will be adjusted based on the header area)
 */
export { HeaderDx } from "./HeaderDx";
export { HeaderDxLarge } from "./HeaderDxLarge";
export { HeaderDxProvider } from "./HeaderDxContext";
