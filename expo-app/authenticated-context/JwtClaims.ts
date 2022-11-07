export type JwtClaims = {
  sub: string;
  aud: string[];
  exp: number;
  iss: string;
  [key: string]: unknown;
};
