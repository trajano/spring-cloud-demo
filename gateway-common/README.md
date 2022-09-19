# Gateway Common

This project contains common elements for gateway services.  So it will have the Spring Data POJO mappings and common functions dealing with JWT.

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

Why not use database?

> Complexity of handling data when the Redis installation is a cluster.  In addition there's a chance of data loss that's implied by the clustering of Redis.  That's basically why it was dropped at one point.
> However, it was determined that using a database was *significantly* slower than Redis that it cannot handle a light load.  However, the techniques and structures used from it was ported back to Redis and made more reliable.
> 
> In addition, JPA does not support reactive frameworks at the moment.  Instead we use Spring Data R2DBC which works like Spring Data JDBC with support for reactive frameworks.
> 
> Optimistic locking using `@Version` wasn't used as data being put in will never be updated, only deleted (via expiration mechanism or explicit revocation) and read.  The only exception would be the refresh token which will be updated. 

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

> Gateway and JWKS provider uses the same Redis instance.  This simplifies and speeds up the requests for the token and validation.  There is no need to manage internal state as much on gateway as the performance of direct Redis access is quite fast already.
> 
> All active *refresh tokens* and their verification keys are stored in Redis.  The signing keys are not associated with the Refresh token.  Because of this, it didn't make sense to use Kafka to handle the distribution of the keys as it will be stored in a Redis in the end.

Why does `refresh_token` track the initial issuance?

> The system would normally allow refresh tokens to be refreshed indefinitely, but there may be a business requirement to force the user to re-authenticate themselves after a given time period.

What validations are done on the access token?

> Only signature validation.  As such there's no need for an `access_token` table.

Why does gateway need to restart if the SSL certificate is updated by LetsEncrypt?

> Limitation of Spring Webflux, it can only read the keystore at start up.  It relies on the fact that there is multiple gateway instances and is configured to restart on `any` condition which is the default.
> 
> The way it works is if there is a new certificate `acme` will update the value of the SHA512 of the updated store.
> 
> The gateway server will check the value at the end of each request and when it completes it will set the `nodeUpdating` value to true and queue itself for termination.  If it is already `true`, it will not do anything.
> 
> When the gateway instance restarts, it clears of the `nodeUpdating` flag so the next request on the other server will have its turn to update.  Only one should update at a time, but even if it is a race condition, it's still okay as everything will resolve in the end.
> 
> Even if there is a service that forgets to clear the flag, any new instance will clear it of at startup.

Why does gateway not use distroless Java?

> It needs bash to set up some environment variables and fetch a copy of the key store from Redis to place it in the path before starting up the application.

How do I integrate my own identity provider?

> `simple-auth.enabled: false` and provide an implementation of IdentityService and a @RestController that extends AbstractAuthController with the authentication request type used by identity service passed in as a generic parameter. 
