import * as SQLite from "expo-sqlite";
import { useEffect, useRef } from "react";
type DbLoadedState = {
  loaded: true;
  db: SQLite.Database;
};
type DbUnloadedState = {
  loaded: false;
  db: undefined;
};
type DbState = DbLoadedState | DbUnloadedState;
export function useDb(databaseName: string): DbState {
  const dbRef = useRef<SQLite.Database>();
  useEffect(() => {
    SQLite.openDatabase(
      databaseName,
      undefined,
      undefined,
      undefined,
      (nextDb) => {
        dbRef.current = nextDb;
      }
    );
    return () => {
      if (dbRef.current !== undefined) {
        (dbRef.current as unknown as { closeAsync(): Promise<void> })
          .closeAsync()
          // not much can be done at this point so just log an error
          .catch((e) => console.error(e))
          .finally(() => {
            dbRef.current = undefined;
          });
      }
    };
  });
  if (dbRef.current) {
    return {
      loaded: true,
      db: dbRef.current,
    };
  } else {
    return {
      loaded: false,
    };
  }
}
