export interface LoadableAssets {
  total: number;
  /**
   * This is a functin that performs the asset load.  Each time an asset is 
   * successfully loaded, the callback function is called with the 
   * present number of loaded artifacts.  The callback function can be used
   * to update the state of a component.
   * @param callback
   */
  load(callback: (loaded: number) => void): Promise<void>;
}
