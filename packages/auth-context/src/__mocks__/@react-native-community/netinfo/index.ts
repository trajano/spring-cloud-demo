import type NetInfo from '@react-native-community/netinfo';
import type {
  NetInfoChangeHandler,
  NetInfoConfiguration,
  NetInfoState,
} from '@react-native-community/netinfo';

export enum NetInfoStateType {
  unknown = 'unknown',
  none = 'none',
  cellular = 'cellular',
  wifi = 'wifi',
  bluetooth = 'bluetooth',
  ethernet = 'ethernet',
  wimax = 'wimax',
  vpn = 'vpn',
  other = 'other',
}

const connectedState: NetInfoState = {
  type: NetInfoStateType.wifi,
  isConnected: true,
  isInternetReachable: true,
  details: {
    ssid: null,
    bssid: null,
    strength: null,
    ipAddress: null,
    subnet: null,
    frequency: null,
    isConnectionExpensive: false,
    linkSpeed: null,
    rxLinkSpeed: null,
    txLinkSpeed: null,
  },
};

const currentStateMock = jest.fn<NetInfoState, []>(() => connectedState);
let listeners: NetInfoChangeHandler[] = [];

export default <typeof NetInfo>{
  fetch: jest.fn(() => Promise.resolve(currentStateMock())),
  refresh: jest.fn(() => Promise.resolve(currentStateMock())),
  configure: jest.fn((_configuration: Partial<NetInfoConfiguration>) =>
    jest.fn()
  ),
  addEventListener: jest.fn((listener) => {
    listeners.push(listener);
    return () =>
      listeners.splice(
        listeners.findIndex((v) => v === listener),
        1
      );
  }),
  useNetInfo: jest.fn(() => currentStateMock()),
};

/**
 * Sets the connection state and fires all the listeners
 * @param nextState
 */
export function setConnectionState(nextState: NetInfoState): void {
  currentStateMock.mockImplementation(() => nextState);
  listeners.forEach((listener) => listener(nextState));
}

export function resetConnectionState(): void {
  currentStateMock.mockImplementation(() => connectedState);
  listeners = [];
}
