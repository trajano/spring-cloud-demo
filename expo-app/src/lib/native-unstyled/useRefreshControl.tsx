import { ReactElement, useState } from 'react';
import { RefreshControlProps } from 'react-native';
import { StyledProps } from '../../components';
import { RefreshControl } from './components';
/**
 * This is a hook that provides a simplified API for common operations on RefreshControl.
 */
export function useRefreshControl(onRefresh: () => Promise<void>, refreshControlProps?: Omit<StyledProps<RefreshControlProps>, "refreshing" | "onRefresh">): ReactElement<StyledProps<RefreshControlProps>> {
    const [refreshing, setRefreshing] = useState(false);
    async function doRefresh() {
        try {
            setRefreshing(true);
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    }

    return <RefreshControl {...refreshControlProps} refreshing={refreshing} onRefresh={doRefresh} />
}