import base64url from "base64url";
import * as jose from "jose";
import * as pako from "pako";
import { JwtClaims } from "./JwtClaims";

/**
 *
 * @param accessToken access token (may be a compressed JWT)
 * @param jwksUrl
 * @param clientId
 * @return the payload converted to an object
 */
export async function jwtVerify<P extends JwtClaims>(
  accessToken: string,
  jwksUrl: URL,
  issuer: string,
  clientId: string
): Promise<P> {
  const decodedCompressed = base64url.toBuffer(accessToken);
  const jwt = pako.inflate(decodedCompressed, { to: "string" });
  const jwksFetch = await fetch(jwksUrl);
  const jwksJson = await jwksFetch.json();
  const jwks = jose.createRemoteJWKSet(jwksUrl);
  const { payload } = await jose.jwtVerify(jwt, jwks, {
    audience: clientId,
    issuer: issuer,
  });
  return payload as P;
}
