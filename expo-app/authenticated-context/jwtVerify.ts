import base64url from "base64url";
import * as jose from "node-jose";
import * as pako from "pako";

import { JwtClaims } from "./JwtClaims";

/**
 * @param accessToken Access token (may be a compressed JWT)
 * @param jwksUrl
 * @param clientId
 * @returns The payload converted to an object
 */
export async function jwtVerify<P extends JwtClaims>(
  accessToken: string | null,
  jwksUrl: string,
  issuer: string,
  clientId: string
): Promise<P> {
  if (accessToken === null) {
    return {
      sub: "",
      iss: "",
      aud: [],
      exp: 0,
    } as unknown as P;
  }
  try {
    const decodedCompressed = base64url.toBuffer(accessToken);
    const jwt = pako.inflate(decodedCompressed, { to: "string" });
    const jwksFetch = await fetch(jwksUrl);
    const jwksJson = (await jwksFetch.json()) as object;
    const jwks = await jose.JWK.asKeyStore(jwksJson);
    const jwsResult = await jose.JWS.createVerify(jwks, {
      allowEmbeddedKey: false,
    }).verify(jwt);
    const payload = JSON.parse(jwsResult.payload.toString()) as P;
    if (
      Array.isArray(payload.aud) &&
      payload.exp &&
      payload.sub &&
      payload.iss === issuer &&
      payload.aud.findIndex((aud) => aud === clientId) >= 0 &&
      payload.exp >= Date.now() / 1000
    ) {
      return payload;
    } else {
      throw new Error("JWT not valid");
    }
  } catch (e) {
    throw new Error(`e`, { cause: e });
  }
}
