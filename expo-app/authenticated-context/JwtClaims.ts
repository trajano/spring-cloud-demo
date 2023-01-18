export interface JwtClaims {
  [key: string]: unknown;
  sub: string;
  aud: string[];
  exp: number;
  iss: string;
}
