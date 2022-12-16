import type NetInfo from '@react-native-community/netinfo';
import type {
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

export default <typeof NetInfo>{
  fetch: jest.fn(() => Promise.resolve(currentStateMock())),
  refresh: jest.fn(() => Promise.resolve(currentStateMock())),
  configure: jest.fn((_configuration: Partial<NetInfoConfiguration>) => {}),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => currentStateMock()),
};
export function setConnectionState(nextState: NetInfoState) {
  currentStateMock.mockImplementation(() => nextState);
}

export function resetConnectionState() {
  currentStateMock.mockImplementation(() => connectedState);
}
