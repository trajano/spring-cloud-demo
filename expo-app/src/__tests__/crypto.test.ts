/** @jest-environment node */
import * as jose from "node-jose";
describe("jwt", () => {
  test("verify", async () => {
    const jwks = {
      keys: [
        {
          alg: "ES256",
          crv: "P-256",
          kid: "WbVD",
          kty: "EC",
          use: "sig",
          x: "fkmFUaFzezCVOWLSSOZgWoTNFPGXAypSYnptTcohL2k",
          y: "X8GPSzCkEgqcyXg0w2cmN_kbznSko9N018ABpaA4yGs",
        },
        {
          alg: "ES256",
          crv: "P-256",
          kid: "7P1t",
          kty: "EC",
          use: "sig",
          x: "gWexlgjevNdl6o9h8_PuWH6INRtfK0SPcjqphK9WcsM",
          y: "cJ5ufMf-reSSNpIpm0YRdWwQCH-oBFpPD46KKK9JAug",
        },
        {
          alg: "ES256",
          crv: "P-256",
          kid: "WGJB",
          kty: "EC",
          use: "sig",
          x: "JEj5LQoWTWH3IhGsEkpLaiLyClGCmP-a-J0pOXCiIzc",
          y: "dvDO8h6h7dre0_R76ShRsCl4KzVXvyLg1aAb2w6kJc8",
        },
        {
          alg: "ES256",
          crv: "P-256",
          kid: "McRs",
          kty: "EC",
          use: "sig",
          x: "RzbL-fvADpykrlznAGMtr0FuOfaIrsf3U7J9rNLfjRk",
          y: "IkMhz503rNg2JI6cdmF6K7VK5FzTD1i2OXFg41GiRls",
        },
        {
          alg: "ES256",
          crv: "P-256",
          kid: "0iAz",
          kty: "EC",
          use: "sig",
          x: "WE_NghX0FjXaOE5NoK_F-b2wQF3ttktXnfkgnl3f0Rw",
          y: "dV0pZiAe3qYKOafTHsqJ8e2zdHBUDtUPTbp6eeH6Jck",
        },
        {
          alg: "ES256",
          crv: "P-256",
          kid: "ggyk",
          kty: "EC",
          use: "sig",
          x: "cz2JE-N1Oxyg-4dZKdD_G8JBmvzwI4eYr0KgCSITFuQ",
          y: "Y4nVrULpibHjQbSD-wvvjyV0jVVVrzUkqnAS3siqxkQ",
        },
      ],
    };
    const jwt =
      "eyJraWQiOiIwaUF6IiwiY3R5IjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJzdWIiOiJHZ2dnIiwiZXhwIjoxNjY2MDI4NTY2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0IiwianRpIjoiYzdkMzZlOGEtYzU0My00NDA2LTljZDEtYjg5MmQ1N2U5MGNmIiwiYXVkIjpbInVua25vd24iLCJodHRwOi8vbG9jYWxob3N0Il19.5St70UzyU-nmt8Ape4CMswPSdogDSpNBp7w8jPK2Sk7By9z1LfAuBtpdyeAH1yk6_e1H_nA7gj7ZEdBvyErEwQ";

    const keystore = await jose.JWK.asKeyStore(jwks);
    const jwsResult = await jose.JWS.createVerify(keystore, {
      allowEmbeddedKey: false,
    }).verify(jwt);
    expect(JSON.parse(jwsResult.payload.toString())).toEqual({
      sub: "Gggg",
      exp: 1666028566,
      iss: "http://localhost",
      jti: "c7d36e8a-c543-4406-9cd1-b892d57e90cf",
      aud: ["unknown", "http://localhost"],
    });
  });
});
