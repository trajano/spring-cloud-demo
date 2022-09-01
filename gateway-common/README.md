## OAuth Token structural requirements

* The tokens are signed JWTs containing claims.
* The signature algorithm must be `RSA_USING_SHA256`
* The `jti` claim on all token types are the same.  Must be present.
* The `exp` claim indicates the lifetime of each token type.  Must be present.

### Access token
* The access token would contain pertinent information that can be exposed to the client.
* The `sub` claim is required. (NB: determining if it should be mandatory since GW doesn't really care and it's more of an internal thing)

### Refresh token
* The refresh token is meant to be consumed only by the server side and not the client.
* The refresh token does not contain any other information aside from:
  * `jti`
  * `exp`
  * `nbf`
* The `nbf` claim indicates when the refresh token may be first used.  This will prevent the use of the refresh endpoint too early.  The `nbf` is not required.
* The token itself is mangled such that the header is replaced with just the `kid`.  This will prevent it from being used with standard JWT parsers and reduce size by a few bytes.

### Secret claims

These are not part of the OAuth token per se, but they are represented as JWT Claims, but not a JWT.  They are associated with the `refresh_token`.

## Expiration Timings

* `atl` access token lifetime
* `rtl` refresh token lifetime
* `jwkl` JSON Web Key lifetime
* `sl` secret life time
* `skbs` signing key block size
* `now` represents now


* `atl <= rtl` though normally they're not equal
* `atl == skbs` this must be true because if it deviates then the access token cannot be validated
* There must be a public key that can validate the access token so long as the access token has not expired.
* There must be a public key that can validate the refresh token so long as the access token has not expired.
* ~~`/jwks` must contain the public keys to validate the refresh and access token? Do we even need it?~~
* `/jwks` must contain the public keys to validate **access tokens only**, so it will only contain keys that are active for a period for access tokens.  No refresh token validation needs to be done on the client because it does not contain any information that the client needs to vet. The access token keys are there to allow apps to validate the claims that were sent by the server or from internal services that perform token validation.
* the public JWKS must show at least a previous set `atl + now`

## Identity server overrides

The identity server can provide an `exp` claim that specifies when the data will expire for the claims and the secret claims.  These override the properties that are set.

## FAQ

Why not use JPA?

> Because JPA does not support reactive frameworks at the moment.  Instead we use Spring Data R2DBC which works like Spring Data JDBC with support for reactive frameworks.

Why not use Redis?

> Complexity of handling data when the Redis installation is a cluster.  In addition there's a chance of data loss that's implied by the clustering of Redis.
>
> Using a database may be slow but at least we have reliability.

Why is there little use of `@Version` for optimistic locking?

> The data being put in will never be updated, only deleted (via expiration mechanism or explicit revocation) and read.  The only exception would be the refresh token which will be updated.

Why is `jti` the same on access token, refresh token?

> To make it easier to trace and debug the `jti` is made the same for all three.
>
> Security and privacy wise, if someone were to get the `jti` on the app they would already know the client level information (unless we start using JWE to encrypt the access token).
> If they were to get the `jti` on the server side, they'd already have access to the database and file system.

Why not use JWE for the access token?

> Even if we encrypt the data for the access token, the data will need to be decrypted on the client side which we have no control over.  The data needs to be encrypted with a public key that's on the client device as well.
>
> The signature is still needed because the token is sent back to the server and the validity needs to be checked.

How does token validation work?

> (TBD) when the JWKS are created or removed by jwks-provider, a Kafka message is sent with the information.  The consumer will take those updates and manage their internal state of the JWKS.

Can gateway consume Kafka messages and manage the JWKS internally rather than accessing the same data store?

> Yes, its an optimization to save a database round trip, it also avoids having to cache on Redis to improve performance.
>
> However, this should only be done for `access_token` and not `refresh_token` because refresh tokens need to track back keys that are still in use.

Why does `refresh_token` track the initial issuance?

> The system would normally allow refresh tokens to be refreshed indefinitely, but there may be a business requirement to force the user to re-authenticate themselves after a given time period.

What validations are done on the access token?

> Only signature validation.  As such there's no need for an `access_token` table.
