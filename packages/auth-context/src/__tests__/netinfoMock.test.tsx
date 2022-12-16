import NetInfo, {
  NetInfoStateType, resetConnectionState, setConnectionState
} from '@react-native-community/netinfo';
it("foo", async () => {
  const c = await NetInfo.fetch();
  expect(c.isInternetReachable).toBeTruthy();
  setConnectionState({
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
  })
  const cz = await NetInfo.fetch();
  expect(cz.isInternetReachable).toBeFalsy();
  resetConnectionState();
  const cy = await NetInfo.fetch();
  expect(cy.isInternetReachable).toBeTruthy();
})
