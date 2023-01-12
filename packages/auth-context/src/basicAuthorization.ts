import { encode } from 'js-base64';

export function basicAuthorization(username: string, password: string): string {
  const encoded = encode(`${username}:${password}`);
  return `Basic ${encoded}`;
}
