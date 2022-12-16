import type NetInfo from '@react-native-community/netinfo';
import type {
  NetInfoConfiguration,
  NetInfoState
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

export default <typeof NetInfo>{
  fetch: jest.fn(() => Promise.resolve(connectedState)),
  refresh: jest.fn(() => Promise.resolve(connectedState)),
  configure: jest.fn((_configuration: Partial<NetInfoConfiguration>) => {}),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => connectedState),
};
