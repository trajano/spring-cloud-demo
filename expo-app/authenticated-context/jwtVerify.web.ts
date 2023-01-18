import base64url from "base64url";
import * as jose from "jose";
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
  jwksUrl: URL,
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
  const decodedCompressed = base64url.toBuffer(accessToken);
  const jwt = pako.inflate(decodedCompressed, { to: "string" });
  const jwks = jose.createRemoteJWKSet(jwksUrl);
  const { payload } = await jose.jwtVerify(jwt, jwks, {
    audience: clientId,
    issuer,
  });
  return payload as P;
}
