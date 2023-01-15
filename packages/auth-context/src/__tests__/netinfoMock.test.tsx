import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';

/* eslint-disable jest/no-mocks-import */
// expose these two to allow testing.
import {
  resetConnectionState,
  setConnectionState,
} from '../__mocks__/@react-native-community/netinfo';

/* eslint-enable jest/no-mocks-import */

it('work closely to the real thing', async () => {
  const c = await NetInfo.fetch();
  expect(c.isInternetReachable).toBeTruthy();
  const mysub = jest.fn();
  const sub = NetInfo.addEventListener(mysub);
  const newState: NetInfoState = {
    type: NetInfoStateType.wifi,
    isConnected: true,
    isInternetReachable: false,
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
  setConnectionState(newState);
  const cz = await NetInfo.fetch();
  expect(cz.isInternetReachable).toBeFalsy();
  expect(mysub).toHaveBeenCalledWith(newState);
  sub();
  resetConnectionState();
  const cy = await NetInfo.fetch();
  expect(cy.isInternetReachable).toBeTruthy();
});
