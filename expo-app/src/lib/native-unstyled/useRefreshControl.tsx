import { ReactElement, useCallback, useState } from "react";
import { RefreshControlProps as RNRefreshControlProps } from "react-native";

import { StyledProps } from "./StyledProps";
import { RefreshControl } from "./components";
type RefreshControlProps = StyledProps<
  Omit<RNRefreshControlProps, "refreshing" | "onRefresh">
> & {
  /**
   * Handles errors that may be thrown onRefresh. If not specified it writes the
   * error to console.error.
   */
  onError?: (err: unknown) => void;
};
/**
 * This is a hook that provides a simplified API for common operations on
 * RefreshControl.
 */
export function useRefreshControl(
  onRefresh: () => void | Promise<void>,
  { onError, ...refreshControlProps }: RefreshControlProps = {
    onError: console.error,
  }
): ReactElement<StyledProps<RNRefreshControlProps>> {
  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.resolve(onRefresh())
      .catch(onError)
      .finally(() => setRefreshing(false));
  }, [onRefresh, onError]);

  return (
    <RefreshControl
      {...refreshControlProps}
      refreshing={refreshing}
      onRefresh={doRefresh}
    />
  );
}
