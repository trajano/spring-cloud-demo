import base64url from "base64url";
import * as jose from "jose";
import * as pako from "pako";

/**
 *
 * @param accessToken access token (may be a compressed JWT)
 * @param jwksUrl
 * @param clientId
 */
export async function jwtVerify(
  accessToken: string,
  jwksUrl: URL,
  clientId: string
): Promise<Record<string, unknown>> {
  const decodedCompressed = base64url.toBuffer(accessToken);
  const jwt = pako.inflate(decodedCompressed, { to: "string" });
  const jwksFetch = await fetch(jwksUrl);
  const jwksJson = await jwksFetch.json();
  const jwks = await jose.JWK.asKeyStore(jwksJson);
  const jwsResult = await jose.JWS.createVerify(jwks, {
    allowEmbeddedKey: false,
  }).verify(jwt);
  const payload = JSON.parse(jwsResult.payload.toString()) as Partial<{
    sub: string;
    aud: string[];
    exp: number;
  }>;
  if (
    payload.aud &&
    payload.exp &&
    payload.sub &&
    payload.aud.findIndex((aud) => aud === clientId) >= 0 &&
    payload.exp >= Date.now() / 1000
  ) {
    return payload;
  } else {
    throw new Error("JWT not valid");
  }
}
