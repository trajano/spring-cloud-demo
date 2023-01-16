import * as SQLite from "expo-sqlite";
import { useEffect, useRef } from "react";
interface DbLoadedState {
  loaded: true;
  db: SQLite.Database;
}
interface DbUnloadedState {
  loaded: false;
  db: undefined;
}
type DbState = DbLoadedState | DbUnloadedState;
export function useDb(databaseName: string): DbState {
  const dbRef = useRef<SQLite.WebSQLDatabase>();
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
        dbRef.current.closeAsync();
        dbRef.current = undefined;
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
      db: undefined,
    };
  }
}
