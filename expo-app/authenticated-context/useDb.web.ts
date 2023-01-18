interface DbUnloadedState {
  loaded: false;
  db: undefined;
}
type DbState = DbUnloadedState;
/**
 * WebSQL lite is not supported on the web specifically on firefox
 * @param databaseName
 * @returns
 */
export function useDb(_databaseName: string): DbState {
  return {
    loaded: false,
    db: undefined,
  };
}
