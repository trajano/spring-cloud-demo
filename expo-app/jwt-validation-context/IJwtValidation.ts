export interface IJwtValidation {
  verify(jwt: string): Promise<Record<string, unknown>>;
}
