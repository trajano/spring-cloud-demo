import { ReactElement, useCallback, useState } from 'react';
import { RefreshControlProps } from 'react-native';

import { RefreshControl } from './components';
import { StyledProps } from './StyledProps';
/**
 * This is a hook that provides a simplified API for common operations on RefreshControl.
 */
export function useRefreshControl(onRefresh: () => Promise<void>, refreshControlProps?: StyledProps<Omit<RefreshControlProps, "refreshing" | "onRefresh">>): ReactElement<StyledProps<RefreshControlProps>> {
    const [refreshing, setRefreshing] = useState(false);
    const doRefresh = useCallback(async function doRefresh() {
        try {
            setRefreshing(true);
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    }, []);

    return <RefreshControl {...refreshControlProps} refreshing={refreshing} onRefresh={doRefresh} />
}